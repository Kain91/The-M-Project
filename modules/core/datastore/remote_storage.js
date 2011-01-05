// ==========================================================================
// Project:   The M-Project - Mobile HTML5 Application Framework
// Copyright: (c) 2010 M-Way Solutions GmbH. All rights reserved.
// Creator:   Sebastian
// Date:      02.12.2010
// License:   Dual licensed under the MIT or GPL Version 2 licenses.
//            http://github.com/mwaylabs/The-M-Project/blob/master/MIT-LICENSE
//            http://github.com/mwaylabs/The-M-Project/blob/master/GPL-LICENSE
// ==========================================================================

m_require('core/datastore/data_provider.js');

/**
 * @class
 *
 * Encapsulates access to a remote storage, a json based webservice.
 *
 * @extends M.DataProvider
 */
M.RemoteStorageProvider = M.DataProvider.extend(
/** @scope M.RemoteStorageProvider.prototype */ {

    /**
     * The type of this object.
     * @type String
     */
    type: 'M.RemoteStorageProvider',

    /**
     * The type of this object.
     * @type Object
     */
    config: null,

    /* CRUD methods */

    save: function(obj) {

        var config = this.config[obj.model.name];
        var result = null;
        var dataResult = config.create.map(obj.model.record);

        if(obj.model.state === M.STATE_NEW) {   /* if the model is new we need to make a create request, if not new then we make an update request */
            
            this.remoteQuery('create', config.location + config.create.url, config.create.httpMethod, dataResult, obj, null);
            
        } else { // make an update request

            var updateUrl = config.update.url.replace(/<%=\s+([.|_|-|$|�|a-zA-Z]+[0-9]*[.|_|-|$|�|a-zA-Z]*)\s*%>/, object.model.record.ID);

            this.remoteQuery('update', updateUrl, config.update.httpMethod, dataResult, obj, function(xhr) {
                  xhr.setRequestHeader("X-Http-Method-Override", config.update.httpMethod);
            });
        }
        
    },

    del: function(obj) {
        var config = this.config[obj.model.name];
        var delUrl = config.del.url.replace(/<%=\s+([.|_|-|$|�|a-zA-Z]+[0-9]*[.|_|-|$|�|a-zA-Z]*)\s*%>/,obj.model.get('ID'));
        delUrl = config.location + delUrl + '.json';

        this.remoteQuery('delete', delUrl, config.del.httpMethod, null, obj,  function(xhr) {
            xhr.setRequestHeader("X-Http-Method-Override", config.del.httpMethod);
        });
    },

    find: function(obj) {
        var config = this.config[obj.model.name];

        var readUrl = obj.ID ? config.read.url.one.replace(/<%=\s+([.|_|-|$|�|a-zA-Z]+[0-9]*[.|_|-|$|�|a-zA-Z]*)\s*%>/,obj.ID) : config.read.url.all;
        readUrl = config.location + readUrl + '.json';

        this.remoteQuery('read', readUrl, config.read.httpMethod, null, obj);

    },

    createModelsFromResult: function(data, callback, obj) {
        var result = [];
        var config = this.config[obj.model.name]
        if(_.isArray(data)) {
            for(var i in data) {
                var res = data[i];
                /* create model record from result by first map with given mapper function before passing
                 * to createRecord
                 */
                result.push(obj.model.createRecord($.extend(config.read.map(res.contact), {state: M.STATE_VALID})));
            }
        } else if(typeof(data) === 'object') {
            result.push(obj.model.createRecord($.extend(config.read.map(data.contact), {state: M.STATE_VALID})));
        }
        callback(result);
    },

    remoteQuery: function(opType, url, type, data, obj, beforeSend) {
        var that = this;

        console.log('### REMOTE URL: ' + url);
        console.log('### REMOTE TYPE: ' + type);
        console.log('### DATA: ' + data);
        console.log('### BEFORE SEND: ' + beforeSend);

        M.Request.init({
            url: url,
            method: type,
            isJSON: YES,
            contentType: 'application/JSON',
            data: data ? data : null,
            onSuccess: function(data) {

                if(opType === 'delete') {
                    obj.model.recordManager.remove(obj.model.m_id);
                }

                if(obj.onSuccess && obj.onSuccess.target && obj.onSuccess.action) {
                    obj.onSuccess = that.bindToCaller(obj.onSuccess.target, obj.onSuccess.target[obj.onSuccess.action], [data]);
                    if(opType === 'read') {
                        that.createModelsFromResult(data, obj.onSuccess, obj);
                    } else {
                        obj.onSuccess();
                    }
                }else {
                    M.Logger.log('No success callback given.', M.WARN);
                }
            },
            onError: function(req, msg) {
                if(obj.onError && typeof(obj.onError) === 'function') {
                    obj.onError(msg);
                }
                if(obj.onError && obj.onError.target && obj.onError.action) {
                    obj.onError = this.bindToCaller(obj.onError.target, obj.onError.target[obj.onError.action], msg);
                    obj.onError(msg);
                } else if (typeof(obj.onError) !== 'function') {
                    M.Logger.log('No error callback given.', M.WARN);
                }
            },
            beforeSend: beforeSend ? beforeSend : null
        }).send();    
    },

    /**
     * creates a new data provider instance with the passed configuration parameters
     * @param obj
     */
    configure: function(obj) {
        console.log('configure() called.');
        // maybe some value checking
        return this.extend({
            config:obj
        });
    }

}); 