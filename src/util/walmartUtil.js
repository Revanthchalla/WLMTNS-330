'use strict'

var _ = require('lodash')
var crypto = require('crypto')
var logger = require('winston')
var CONSTANTS = require('../walmartConstants')
var request = require('request')
var maxRetry = 5
var retryTimingSlot = [10000, 20000, 30000, 30000, 30000]

exports.signRequest = function (encryptedPrivateKey, input) {
  var private_key_buffer = new Buffer(encryptedPrivateKey)
  var private_key = '-----BEGIN PRIVATE KEY-----\r\n' + private_key_buffer.toString() + '\r\n-----END PRIVATE KEY-----'

  try {
    var sign = crypto.createSign('RSA-SHA256')
    sign.write(input)
    sign.end()
    var signature = sign.sign(private_key, 'base64')
    return signature

  } catch(e) {
    logger.debug('walmartUtil, signRequest, issue with generating signature : ' + e.code  + ', ' + e.message)
    logger.debug('walmartUtil, signRequest, switching to key generation for windows ')

    private_key = getKeyForWindows(private_key_buffer)
    var signWin = crypto.createSign('RSA-SHA256')
    signWin.write(input)
    signWin.end()
    var signatureWin = signWin.sign(private_key, 'base64')
    return signatureWin
  }
}

function getKeyForWindows(key) {
  var a = key.slice(0,64)
  for(var i=64; i <=784 ; i+=64){
    a = a + '\n' + key.slice(i, i+64)
  }
  a = a + '\n' + key.slice(832)
  return '-----BEGIN EC PRIVATE KEY-----\r\n' + a.toString() + '\r\n-----END EC PRIVATE KEY-----'
}

exports.addHeaders = function (requestOptions, unixTimeStamp, authorization) {
  if(!requestOptions.headers)
    requestOptions.headers = {}
  if(!requestOptions.headers['Accept'])
    requestOptions.headers['Accept'] = 'application/xml'
  if(!requestOptions.headers['Content-Type'])
    requestOptions.headers['Content-Type'] = 'application/xml'
  if(!requestOptions.headers[CONSTANTS.REQUEST_HEADER_SERVICE_NAME])
    requestOptions.headers[CONSTANTS.REQUEST_HEADER_SERVICE_NAME] = CONSTANTS.WALMART_SERVICE_NAME

  //TODO : Put the values in constants file
  requestOptions.headers[CONSTANTS.REQUEST_HEADER_CORRELATION_ID] = unixTimeStamp

  //Remove if logic after Aug 28, 2019 - WLMTNS-216
  if(authorization.consumerId) {
    requestOptions.headers[CONSTANTS.REQUEST_HEADER_TIMESTAMP] = unixTimeStamp
    requestOptions.headers[CONSTANTS.REQUEST_HEADER_AUTH_SIGNATURE] = authorization.signature
    requestOptions.headers[CONSTANTS.REQUEST_HEADER_CONSUMER_ID] = authorization.consumerId

    if(!!authorization.consumerChannelType)
      requestOptions.headers[CONSTANTS.REQUEST_HEADER_CHANNEL_TYPE  ] = authorization.consumerChannelType 
  } else {
    requestOptions.headers[CONSTANTS.REQUEST_HEADER_AUTHORIZATION] = 'Basic ' + authorization.encodedKey
    requestOptions.headers[CONSTANTS.REQUEST_HEADER_ACCESS_TOKEN] = authorization.accessToken
  }

  return requestOptions
}

var getAccessToken = exports.getAccessToken = function(clientId, clientSecret, unixTimeStamp, retryCount, callback) {
  try {
    if(!CONSTANTS.ACCESSTOKEN_ERROR_STATUSCODE) CONSTANTS['ACCESSTOKEN_ERROR_STATUSCODE'] = []
    var encodedKey = new Buffer(clientId + ':' + clientSecret).toString('base64') //Buffer.from(clientId + ':' + clientSecret).toString('base64') - Use this in v10, new Buffer is deprecated in v10
    var opts = {
      uri: 'https://marketplace.walmartapis.com/v3/token',
      method: 'POST',
      headers: {
        'Authorization': 'Basic ' + encodedKey,
        'Content-Type': 'application/x-www-form-urlencoded',
        'Accept': 'application/json',
        'WM_SVC.NAME': 'Walmart Marketplace',
        'WM_QOS.CORRELATION_ID': unixTimeStamp,
        'WM_SVC.VERSION': '1.0.0'
      },
      body: 'grant_type=client_credentials',
      gzip: true
    }
    
    request(opts, function(err, res, body) {
      if(err) {
        logger.info('AbstractAdaptor, inside makeRequest err: ' + err)
        return callback(err)
      }
      if(!res || res.statusCode !== 200) {
        if (retryCount === maxRetry && CONSTANTS.ACCESSTOKEN_ERROR_STATUSCODE.indexOf(clientId + '_' + res.statusCode) === -1) {
          logger.info('AbstractAdaptor, inside makeRequest opts: ' + JSON.stringify(opts))
          logger.info('AbstractAdaptor, inside makeRequest res: ' + JSON.stringify(res) + ' statusCode#' + res.statusCode)
          CONSTANTS.ACCESSTOKEN_ERROR_STATUSCODE.push(clientId + '_' + res.statusCode)
        }
        
        handleAccessTokenError(clientId, clientSecret, unixTimeStamp, retryCount, function (err) {
          if (err) {
            return callback(err)
          }
          return callback(null, {
            accessToken: body.access_token,
            encodedKey: encodedKey
          })
        })
      } else {
        if(typeof body !== 'object') {
          try {
            body = JSON.parse(body)
          } catch(ex) {
            body = {}
          }
        }
        
        if(body && body.access_token) {
          return callback(null, {
            accessToken: body.access_token,
            encodedKey: encodedKey
          })
        } else {
          if (retryCount === maxRetry && CONSTANTS.ACCESSTOKEN_ERROR_STATUSCODE.indexOf(clientId + '_' + res.statusCode) === -1) {
            logger.info('AbstractAdaptor, inside makeRequest opts: ' + JSON.stringify(opts))
            logger.info('AbstractAdaptor, inside makeRequest res: ' + JSON.stringify(res) + ' statusCode#' + res.statusCode)
            CONSTANTS.ACCESSTOKEN_ERROR_STATUSCODE.push(clientId + '_' + res.statusCode)
          }

          handleAccessTokenError(clientId, clientSecret, unixTimeStamp, retryCount, function (err) {
            if (err) {
              return callback(err)
            }
            return callback(null, {
              accessToken: body.access_token,
              encodedKey: encodedKey
            })
          })
        }
      }
    })
  } catch(ex) {
    logger.info('getAccessToken, error while making Token API call, ex: ' + ex.message ? ex.message : ex)
    return callback(ex)
  }
}

function handleAccessTokenError (clientId, clientSecret, unixTimeStamp, retryCount, callback) {
  if (retryCount >= maxRetry) {
    return callback(new Error('Received invalid response from Walmart.'))
  }

  retryCount++
  return setTimeout(getAccessToken, retryTimingSlot[retryCount], clientId, clientSecret, unixTimeStamp, retryCount, callback)
}
