"use strict";

var soap = require('soap'),
    path = require('path'),
    Message = require('./Message'),
    Folder = require('./Folder');

var noop = function () {};
var noopThrows = function (err) { if (err) {throw new Error(err)} };

function EWS(config) {
    this._username = config.domain + '\\' + config.username;
    this._password = config.password;
    this._endpoint = 'https://' + path.join(config.url, 'EWS/Exchange.asmx');
    this._exchangeVersoin = config.version || '2010';

    this._services = path.join(__dirname, '/Services/Services.wsdl');

    this._soapClientOptions = {
        ignoredNamespaces: {
            namespaces: [],
            override: true
        }
    };
}

EWS.prototype.connect = function connect (callback) {
    if (!callback || typeof callback !== 'function'){
        callback = noop;
    }
    soap.createClient(this._services, this._soapClientOptions, function (err, client) {
        if (err) {
            return callback(err, false);
        }

        this._client = client;
        this._client.setSecurity(new soap.BasicAuthSecurity(this._username, this._password));
        this._client.addSoapHeader('<t:RequestServerVersion Version="Exchange2010" />');

        callback(null, true);
    }.bind(this), this._endpoint);

    return this;
};

EWS.prototype.CreateItem = function (soapRequest, callback) {
    if (!callback || typeof callback !== 'function'){
        callback = noop;
    }
    this._client.CreateItem(soapRequest, function (err, results) {
        if (err) {
            return callback(err, null);
        }

        if (results.ResponseMessages.CreateItemResponseMessage.ResponseCode == 'NoError') {
            return callback(null, results.ResponseMessages.CreateItemResponseMessage);
        }

        return callback(new Error(results.ResponseMessages.CreateItemResponseMessage.ResponseCode), results);
    });
};

EWS.prototype.FindItem = function (soapRequest, callback) {
    if (!callback || typeof callback !== 'function'){
        callback = noop;
    }
    this._client.FindItem(soapRequest, function (err, results) {
        if (err) {
            return callback(err, null);
        }

        if (results.ResponseMessages.FindItemResponseMessage.ResponseCode == 'NoError') {
            return callback(null, results.ResponseMessages.FindItemResponseMessage);
        }

        return callback(new Error(results.ResponseMessages.FindItemResponseMessage.ResponseCode), results);
    });
};

EWS.prototype.Message = function () {
    return new Message(this);
};

EWS.prototype.Folder = function () {
    return new Folder(this);
};

module.exports = EWS;