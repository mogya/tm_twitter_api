/*
 * ATTENTION: Some efforts has been put in order to produce this code.
 *            If you like and use it consider making a dontation in order
 *            to allow me to do more and provide you with more solutions.
 *
 *            Thanks,
 *            David Riccitelli
 *
 *            To donate, copy and paste this link in your browser:
 * https://www.paypal.com/cgi-bin/webscr?cmd=_donations&business=T5HUU4J5EQTJU&lc=IT&item_name=OAuth%20Adapter&currency_code=USD&bn=PP%2dDonationsBF%3abtn_donate_LG%2egif%3aNonHosted
 *
 * Copyright 2010 David Riccitelli, Interact SpA
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
/*
 * This library currently works only with Twitter, although I'd like to
 * spend some more time to make it generally compatible with other services
 * too.
 *
 * Sample use with Twitter:

 // create a new OAuthAdapter instance by passing by your consumer data and signature method
 var oAuthAdapter = new OAuthAdapter(
 'your-consumer-secret',
 'your-consumer-key',
 'HMAC-SHA1');

 // load the access token for the service (if previously saved)
 oAuthAdapter.loadAccessToken('twitter');

 // consume a service API - in this case the status update by Twitter
 oAuthAdapter.send('https://api.twitter.com/1/statuses/update.json', [['status','Hey @ziodave, I managed to use the #oauth adapter for @titanium consuming @twitterapi']],'Twitter','Tweet published.','Tweet not published.');

 // if the client is not authorized, ask for authorization. the previous tweet will be sent automatically after authorization
 if (oAuthAdapter.isAuthorized() == false)
 {
	 // this function will be called as soon as the application is authorized
     var receivePin = function() {
		 // get the access token with the provided pin/oauth_verifier
         oAuthAdapter.getAccessToken('https://api.twitter.com/oauth/access_token');
		 // save the access token
         oAuthAdapter.saveAccessToken('twitter');
     };

	 // show the authorization UI and call back the receive PIN function
     oAuthAdapter.showAuthorizeUI('https://api.twitter.com/oauth/authorize?' + oAuthAdapter.getRequestToken('https://api.twitter.com/oauth/request_token'), receivePin);
 }

 */
/*
 * The Adapter needs 2 external libraries (oauth.js, sha1.js) hosted at
 *  http://oauth.googlecode.com/svn/code/javascript/
 *
 * Save them locally in a lib subfolder
 */
Ti.include('lib/sha1.js');
Ti.include('lib/oauth.js');

// create an OAuthAdapter instance
var OAuthAdapter = function(pConsumerSecret, pConsumerKey, pSignatureMethod)
 {
	
	Ti.API.info('*********************************************');
	Ti.API.info('If you like the OAuth Adapter, consider donating at');
	Ti.API.info('https://www.paypal.com/cgi-bin/webscr?cmd=_donations&business=T5HUU4J5EQTJU&lc=IT&item_name=OAuth%20Adapter&currency_code=USD&bn=PP%2dDonationsBF%3abtn_donate_LG%2egif%3aNonHosted');
	Ti.API.info('*********************************************');	

    // will hold the consumer secret and consumer key as provided by the caller
    var consumerSecret = pConsumerSecret;
    var consumerKey = pConsumerKey;

    // will set the signature method as set by the caller
    var signatureMethod = pSignatureMethod;

    // the pin or oauth_verifier returned by the authorization process window
    var pin = null;

    // will hold the request token and access token returned by the service
    var requestToken = null;
    var requestTokenSecret = null;
    var accessToken = null;
    var accessTokenSecret = null;

    // the accessor is used when communicating with the OAuth libraries to sign the messages
    var accessor = {
        consumerSecret: consumerSecret,
        tokenSecret: ''
    };

    // holds actions to perform
    var actionsQueue = [];

    // will hold UI components
    var window = null;
    var view = null;
    var webView = null;
    var receivePinCallback = null;

    this.loadAccessToken = function(pService)
    {
        Ti.API.debug('Loading access token for service [' + pService + '].');

        var file = Ti.Filesystem.getFile(Ti.Filesystem.applicationDataDirectory, pService + '.config');
        if (file.exists == false) return;

        var contents = file.read();
        if (contents == null) return;

        try
        {
            var config = JSON.parse(contents.text);
        }
        catch(ex)
        {
            return;
        }
        if (config.accessToken) accessToken = config.accessToken;
        if (config.accessTokenSecret) accessTokenSecret = config.accessTokenSecret;

        Ti.API.debug('Loading access token: done [accessToken:' + accessToken + '][accessTokenSecret:' + accessTokenSecret + '].');
    };
    this.saveAccessToken = function(pService)
    {
        Ti.API.debug('Saving access token [' + pService + '].');
        var file = Ti.Filesystem.getFile(Ti.Filesystem.applicationDataDirectory, pService + '.config');
        if (file == null) file = Ti.Filesystem.createFile(Ti.Filesystem.applicationDataDirectory, pService + '.config');
        file.write(JSON.stringify(
        {
            accessToken: accessToken,
            accessTokenSecret: accessTokenSecret
        }
        ));
        Ti.API.debug('Saving access token: done.');
    };

    // will tell if the consumer is authorized
    this.isAuthorized = function()
    {
        return ! (accessToken == null || accessTokenSecret == null);
    };

    // creates a message to send to the service
    var createMessage = function(pUrl, method)
    {
        var message = {
            action: pUrl ,
            method: (method) ? method : 'POST' ,
            parameters: []
        };
        message.parameters.push(['oauth_consumer_key', consumerKey]);
        message.parameters.push(['oauth_signature_method', signatureMethod]);
        return message;
    };

    // returns the pin
    this.getPin = function() {
        return pin;
    };

    // requests a requet token with the given Url
    this.getRequestToken = function(pUrl)
    {
        accessor.tokenSecret = '';

        var message = createMessage(pUrl);
        OAuth.setTimestampAndNonce(message);
        OAuth.SignatureMethod.sign(message, accessor);

        var client = Ti.Network.createHTTPClient();
        client.open('POST', pUrl, false);
        client.send(OAuth.getParameterMap(message.parameters));

        var responseParams = OAuth.getParameterMap(client.responseText);
        requestToken = responseParams['oauth_token'];
        requestTokenSecret = responseParams['oauth_token_secret'];

        Ti.API.debug('request token got the following response: ' + client.responseText);

        return client.responseText;
    }

    // unloads the UI used to have the user authorize the application
    var destroyAuthorizeUI = function()
    {
        Ti.API.debug('destroyAuthorizeUI');
        // if the window doesn't exist, exit
        if (window == null) return;

        // remove the UI
        try
        {
	        Ti.API.debug('destroyAuthorizeUI:webView.removeEventListener');
            webView.removeEventListener('load', authorizeUICallback);
	        Ti.API.debug('destroyAuthorizeUI:window.close()');
            window.hide();
			// 	        Ti.API.debug('destroyAuthorizeUI:window.remove(view)');
			// window.remove(view);
			// 	        Ti.API.debug('destroyAuthorizeUI:view.remove(webView)');
			// 	        view.remove(webView);
			// 	        Ti.API.debug('destroyAuthorizeUI:nullifying');
			// 	        webView = null;
			//             view = null;
			//             window = null;
        }
        catch(ex)
        {
            Ti.API.debug('Cannot destroy the authorize UI. Ignoring.');
        }
    };

    // looks for the PIN everytime the user clicks on the WebView to authorize the APP
    // currently works with TWITTER
    var authorizeUICallback = function(e)
    {
        Ti.API.debug('authorizeUILoaded');

        var xmlDocument = Ti.XML.parseString(e.source.html);
        var nodeList = xmlDocument.getElementsByTagName('div');

        for (var i = 0; i < nodeList.length; i++)
        {
            var node = nodeList.item(i);
            var id = node.attributes.getNamedItem('id');
            if (id && id.nodeValue == 'oauth_pin')
            {
                pin = node.text;

                if (receivePinCallback) setTimeout(receivePinCallback, 100);

                id = null;
                node = null;

                destroyAuthorizeUI();

                break;
            }
        }

        nodeList = null;
        xmlDocument = null;

    };

    // shows the authorization UI
    this.showAuthorizeUI = function(pUrl, pReceivePinCallback)
    {
        receivePinCallback = pReceivePinCallback;

        window = Ti.UI.createWindow({
            modal: true,
            fullscreen: true
        });
        var transform = Ti.UI.create2DMatrix().scale(0);
        view = Ti.UI.createView({
            top: 5,
            width: 310,
            height: 450,
            border: 10,
            backgroundColor: 'white',
            borderColor: '#aaa',
            borderRadius: 20,
            borderWidth: 5,
            zIndex: -1,
            transform: transform
        });
        closeLabel = Ti.UI.createLabel({
            textAlign: 'right',
            font: {
                fontWeight: 'bold',
                fontSize: '12pt'
            },
            text: '(X)',
            top: 10,
            right: 12,
            height: 14
        });
        window.open();

        webView = Ti.UI.createWebView({
            url: pUrl,
			autoDetect:[Ti.UI.AUTODETECT_NONE]
        });
		Ti.API.debug('Setting:['+Ti.UI.AUTODETECT_NONE+']');
        webView.addEventListener('load', authorizeUICallback);
        view.add(webView);

        closeLabel.addEventListener('click', destroyAuthorizeUI);
        view.add(closeLabel);

        window.add(view);

        var animation = Ti.UI.createAnimation();
        animation.transform = Ti.UI.create2DMatrix();
        animation.duration = 500;
        view.animate(animation);
    };

    this.getAccessToken = function(pUrl)
    {
        accessor.tokenSecret = requestTokenSecret;

        var message = createMessage(pUrl);
        message.parameters.push(['oauth_token', requestToken]);
        message.parameters.push(['oauth_verifier', pin]);

        OAuth.setTimestampAndNonce(message);
        OAuth.SignatureMethod.sign(message, accessor);

        var parameterMap = OAuth.getParameterMap(message.parameters);
        for (var p in parameterMap)
        Ti.API.debug(p + ': ' + parameterMap[p]);

        var client = Ti.Network.createHTTPClient();
        client.open('POST', pUrl, false);
        client.send(parameterMap);

        var responseParams = OAuth.getParameterMap(client.responseText);
        accessToken = responseParams['oauth_token'];
        accessTokenSecret = responseParams['oauth_token_secret'];

        Ti.API.debug('*** get access token, Response: ' + client.responseText);

        processQueue();

        return client.responseText;

    };

    var processQueue = function()
    {
        Ti.API.debug('Processing queue.');
        while ((q = actionsQueue.shift()) != null)
        send(q);

        Ti.API.debug('Processing queue: done.');
    };
    var oauthParams = "OAuth realm,oauth_version,oauth_consumer_key,oauth_nonce,oauth_signature,oauth_signature_method,oauth_timestamp,oauth_token".split(',');
    var makeAuthorizationHeaderString = function(params) {
        var str = ''; 
        for (var i = 0, len = oauthParams.length; i < len ; i++) {
            var key = oauthParams[i];
            if (params[key] != undefined) str += key + '="' + encodeURIComponent(params[key]) + '",';
        }
        Ti.API.debug('authorization header string : ' + str);
        return str;
    }

    var removeOAuthParams = function(parameters) {
        var checkString = oauthParams.join(',') + ',';
        for (var p in parameters) {
           if (checkString.indexOf(p + ",") >= 0) delete parameters[p]; 
        }
    }

    var makePostURL = function(url,parameters) {
        var checkString = oauthParams.join(',') + ',';
        var query = [];
        var newParameters = [];
        for (var i = 0 , len = parameters.length; i < len ; i++) {
           var item = parameters[i];
           if (checkString.indexOf(item[0] + ",") < 0) {
                query.push(encodeURIComponent(item[0]) + "=" + encodeURIComponent(item[1])); 
           } else {
               newParameters.push[item];
           }
        }
        parameters = newParameters;
        if (query.length) {
            query = query.join('&');
            return [url + ((url.indexOf('?') >= 0) ? '&' : '?') + query, parameters];
        } else {
            return [url, parameters];
        }
    }
    var makeGetURL = function(url, parameterMap) {
        var query = [];
        var keys = [];
        for (var p in parameterMap) {
           query.push( encodeURIComponent(p) + "=" + encodeURIComponent(parameterMap[p]) ); 
        }
				query.sort();//(9.1.1.  Normalize Request Parameters)
        if (query.length) {
            query = query.join('&');
            return url + ((url.indexOf('?') >= 0) ? '&' : '?') + query;
        } else {
            return url;
        }
    }

    var send = function(params) {
        var pUrl            = params.url;
        var pParameters     = params.parameters || [];
        var pTitle          = params.title;
        var pMethod         = params.method || "POST";
        var resultByXML      = params.resultByXML || false;

        Ti.API.debug('Sending a message to the service at [' + pUrl + '] with the following params: ' + JSON.stringify(pParameters));
        if (accessToken == null || accessTokenSecret == null)
        {
            Ti.API.debug('The send status cannot be processed as the client doesn\'t have an access token. The status update will be sent as soon as the client has an access token.');
            actionsQueue.push(params);
            return;
        }

        accessor.tokenSecret = accessTokenSecret;
        var message = createMessage(pUrl, pMethod);
        message.parameters.push(['oauth_token', accessToken]);
        for (p in pParameters) message.parameters.push(pParameters[p]);
        OAuth.setTimestampAndNonce(message);
        OAuth.SignatureMethod.sign(message, accessor);
        var parameterMap = OAuth.getParameterMap(message.parameters);
        for (var p in parameterMap) Ti.API.debug(p + ': ' + parameterMap[p]);
        if (pMethod == "GET") {
            pUrl = makeGetURL(pUrl, parameterMap);
            parameterMap = null;
            Ti.API.debug('url for GET:'+pUrl);
        }
        var client = Ti.Network.createHTTPClient();
        client.onerror = function(e){
          Ti.API.debug(e);
          if(params.onError){
            params.onError(e);
          }
        }
        client.onload = function(){
          Ti.API.debug('*** sendStatus, Response: [' + client.status + '] ' + client.responseText);
          if ((""+client.status).match(/^20[0-9]/)) {
            if(params.onSuccess){
              params.onSuccess(client.responseText);
            }
          } else {
            if(params.onError){
              params.onError({error:'[' + client.status + '] ' + client.responseText});
            }
          }
        }
        client.open(pMethod, pUrl, false);
        client.send(parameterMap);

        return null;
    };
    this.send = send;
};
