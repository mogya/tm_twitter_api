// Twitter API Wrapper
var path_lib = '';
if (Titanium.Platform.osname == 'iphone' && Titanium.version < '1.7.0') {
    path_lib = '/lib/';
}
Ti.include(path_lib + 'sha1.js');
Ti.include(path_lib + 'oauth.js');
Ti.include(path_lib + 'oauth_adapter.js');

var TwitterApi = function(params) {
    var self = this;
    var consumerSecret = params.consumerSecret;
    var consumerKey = params.consumerKey;
    var signatureMethod = params.signatureMethod || 'HMAC-SHA1';

    // Do not use queue feature of oAuthAdapter on Android. 
    // it causes "sending message to a Handler on a dead thread" issue.
    this.oAuthAdapter = new OAuthAdapter(consumerSecret, consumerKey, signatureMethod, {
        useQueue: false
    });

    // get AccessToken. Show OAuth UI for user if needs.
    this.init = function(params) {
        var oAuthAdapter = this.oAuthAdapter;
        oAuthAdapter.loadAccessToken('twitter');
        if (oAuthAdapter.isAuthorized() == false) {
            var receivePin = function() {
                oAuthAdapter.getAccessToken('https://api.twitter.com/oauth/access_token', function() {
                    oAuthAdapter.saveAccessToken('twitter');
                });
            };
            oAuthAdapter.getRequestToken('https://api.twitter.com/oauth/request_token', function(token) {
                if (token) {
                    oAuthAdapter.showAuthorizeUI('https://api.twitter.com/oauth/authorize?' + token, receivePin);
                }
            });
        }
    };
    this._callApi = function(params) {
        // replace :var in url to params.var 
        var match = params.url.match(/:[^\/\.]+/g);
        if (match) {
            for (var i = 0; i < match.length; i++) {
                var index = match[i].replace(':', '');
                if (params[index]) {
                    params.url = params.url.replace(match[i], params[index]);
                    delete params[index];
                };
            };
            Ti.API.debug('replaced');
            Ti.API.debug(params);
        };
        var parameters = [];

		for (var index in params){
			if ('url' == index) continue;
			if ('method' == index) continue;
			if ('onSuccess' == index) continue;
			if ('onError' == index) continue;
			if ('parameters' == index) {
	            for (var key in params.parameters) {
	                parameters.push([key, params.parameters[key]]);
	            };
				continue;
			}
            parameters.push([index, params[index]]);
		}

        var oAuthAdapter = this.oAuthAdapter;
        oAuthAdapter.loadAccessToken('twitter');
        var response = oAuthAdapter.send({
            url: params.url,
            parameters: parameters,
            method: params.method,
            onSuccess: function(response) {
                response = JSON.parse(response);
                if (params && params.onSuccess) {
                    params.onSuccess(response);
                } else {
                    Ti.API.error('no success handler');
                }
            },
            onError: function(error) {
                if (params.onError) {
                    params.onError(error);
                } else {
                    Ti.API.error('no error handler');
                    Ti.API.error(error);
                }
            }
        });
    };
    this.callApi = function(params) {
        if (!params) {
            Ti.API.error('twitter api params error. no params.');
            return false;
        }
        if (!params.url) {
            Ti.API.error('twitter api params error. no params.url.');
            return false;
        };
        // implement queue feature by myself. see init() function comment.
        if (this.oAuthAdapter.isAuthorized()) {
            return self._callApi(params);
        } else {
            setTimeout(function() {
                self.callApi(params);
            }, 1000);
        }
    };

    this.clear_accesstoken = function() {
        self.oAuthAdapter.clearAccessToken('twitter');
    };

    this.clear_actionsqueue = function() {
        self.oAuthAdapter.clearActionsQueue();
    };
    
    // Verify if the user is logged on Twitter.
    this.isAuthorized = function() {

        var oAuthAdapter = this.oAuthAdapter;

        oAuthAdapter.loadAccessToken('twitter');

        if (oAuthAdapter.isAuthorized() == false)
            return false;
        else
            return true;

    };

    /**
    Twitter APIs
    We can use same parameter of Twitter API. 
    see http://dev.twitter.com/doc
    Additional params for all APIs.
     params.onSuccess(response)
      callback function when API returns successfully.
     params.onError(error)
      callback function for illegal situation.
    */

    //statuses.public_timeline
    this.statuses_public_timeline = function(params) {
        params.url = 'http://api.twitter.com/1/statuses/public_timeline.json';
        params.method = 'GET';
        return self.callApi(params);
    };
    //statuses.home_timeline
    this.statuses_home_timeline = function(params) {
        params.url = 'http://api.twitter.com/1/statuses/home_timeline.json';
        params.method = 'GET';
        return self.callApi(params);
    };
    //statuses.friends_timeline
    this.statuses_friends_timeline = function(params) {
        params.url = 'http://api.twitter.com/1/statuses/friends_timeline.json';
        params.method = 'GET';
        return self.callApi(params);
    };
    //statuses.user_timeline
    this.statuses_user_timeline = function(params) {
        params.url = 'http://api.twitter.com/1/statuses/user_timeline.json';
        params.method = 'GET';
        return self.callApi(params);
    };
    //statuses.mentions
    this.statuses_mentions = function(params) {
        params.url = 'http://api.twitter.com/1/statuses/mentions.json';
        params.method = 'GET';
        return self.callApi(params);
    };
    //statuses.retweeted_by_me
    this.statuses_retweeted_by_me = function(params) {
        params.url = 'http://api.twitter.com/1/statuses/retweeted_by_me.json';
        params.method = 'GET';
        return self.callApi(params);
    };
    //statuses.retweeted_to_me
    this.statuses_retweeted_to_me = function(params) {
        params.url = 'http://api.twitter.com/1/statuses/retweeted_to_me.json';
        params.method = 'GET';
        return self.callApi(params);
    };
    //statuses.show
    this.statuses_show = function(params) {
        params.url = 'http://api.twitter.com/1/statuses/show/:id.json';
        params.method = 'GET';
        return self.callApi(params);
    };
    //statuses.update
    this.statuses_update = function(params) {
        params.url = 'http://api.twitter.com/1/statuses/update.json';
        params.method = 'POST';
        return self.callApi(params);
    };
    //statuses.destroy
    this.statuses_destroy = function(params) {
        params.url = 'http://api.twitter.com/1/statuses/destroy/:id.json';
        params.method = 'POST';
        return self.callApi(params);
    };
    //statuses.retweet
    this.statuses_retweet = function(params) {
        params.url = 'http://api.twitter.com/1/statuses/retweet/:id.json';
        params.method = 'POST';
        return self.callApi(params);
    };
    //statuses.retweets
    this.statuses_retweets = function(params) {
        params.url = 'http://api.twitter.com/1/statuses/retweets/:id.json';
        params.method = 'GET';
        return self.callApi(params);
    };
    //statuses.retweeted_by
    this.statuses_retweeted_by = function(params) {
        params.url = 'http://api.twitter.com/1/statuses/:id/retweeted_by.json';
        params.method = 'GET';
        return self.callApi(params);
    };
    //statuses.retweeted_by_ids
    this.statuses_retweeted_by_ids = function(params) {
        params.url = 'http://api.twitter.com/1/statuses/:id/retweeted_by/:ids.json';
        params.method = 'GET';
        return self.callApi(params);
    };

    //users.show
    this.users_show = function(params) {
        params.url = 'http://api.twitter.com/1/users/show.json';
        params.method = 'GET';
        return self.callApi(params);
    };
    //users.lookup
    this.users_lookup = function(params) {
        params.url = 'http://api.twitter.com/1/users/lookup.json';
        params.method = 'GET';
        return self.callApi(params);
    };
    //users.search
    this.users_search = function(params) {
        params.url = 'http://api.twitter.com/1/users/search.json';
        params.method = 'GET';
        return self.callApi(params);
    };
    //users.suggestions
    this.users_suggestions = function(params) {
        params.url = 'http://api.twitter.com/1/users/suggestions.json';
        params.method = 'GET';
        return self.callApi(params);
    };
    //users.suggestions.twitter
    this.users_suggestions_twitter = function(params) {
        params.url = 'http://api.twitter.com/1/users/suggestions/:slug.json';
        params.method = 'GET';
        return self.callApi(params);
    };
    //users.profile_image.twitter
    this.users_profile_image_twitter = function(params) {
        params.url = 'http://api.twitter.com/1/users/profile_image/:screen_name.json';
        params.method = 'GET';
        return self.callApi(params);
    };

    //statuses.friends
    this.statuses_friends = function(params) {
        params.url = 'http://api.twitter.com/1/statuses/friends.json';
        params.method = 'GET';
        return self.callApi(params);
    };
    //statuses.followers
    this.statuses_followers = function(params) {
        params.url = 'http://api.twitter.com/1/statuses/followers.json';
        params.method = 'GET';
        return self.callApi(params);
    };
    //trends
    this.trends = function(params) {
        params.url = 'http://api.twitter.com/1/trends.json';
        params.method = 'GET';
        return self.callApi(params);
    };

    //trends.current
    this.trends_current = function(params) {
        params.url = 'http://api.twitter.com/1/trends/current.json';
        params.method = 'GET';
        return self.callApi(params);
    };
    //trends.daily
    this.trends_daily = function(params) {
        params.url = 'http://api.twitter.com/1/trends/daily.json';
        params.method = 'GET';
        return self.callApi(params);
    };
    //trends.weekly
    this.trends_weekly = function(params) {
        params.url = 'http://api.twitter.com/1/trends/weekly.json';
        params.method = 'GET';
        return self.callApi(params);
    };

    //user/lists_create 
    //Creates a new list for the authenticated user. 
    this.user_lists_create = function(params) {
        params.url = 'http://api.twitter.com/1/:user/lists.json';
        params.method = 'POST';
    };
    // :user/lists/:id
    // Updates the specified list.
    this.user_lists_update = function(params) {
        params.url = 'http://api.twitter.com/1/:user/lists/:id.json';
        params.method = 'POST';
    };
    // :user/lists
    // List the lists of the specified user.
    this.user_lists_of_user = function(params) {
        params.url = 'http://api.twitter.com/1/:user/lists.json';
        params.method = 'GET';
    };
    // :user/lists/:id
    // Show the specified list. 
    this.user_lists_get = function(params) {
        params.url = 'http://api.twitter.com/1/:user/lists/:id.json';
        params.method = 'GET';
    };
    // :user/lists/:id
    // Deletes the specified list
    this.user_lists_delete = function(params) {
        params.url = 'http://api.twitter.com/1/:user/lists/:id.json';
        params.method = 'POST';
        params._method = 'DELETE';
    };
    // :user/lists/:id/statuses
    // Show tweet timeline for members of the specified list.
    this.user_lists_statuses = function(params) {
        params.url = 'http://api.twitter.com/1/:user/lists/:id/statuses.json';
        params.method = 'GET';
    };
    // :user/lists/memberships
    // List the lists the specified user has been added to.
    this.user_lists_memberships = function(params) {
        params.url = 'http://api.twitter.com/1/:user/lists/memberships.json';
        params.method = 'GET';
    };
    // :user/lists/subscriptions
    // List the lists the specified user follows.
    this.user_lists_subscriptions = function(params) {
        params.url = 'http://api.twitter.com/1/:user/lists/subscriptions.json';
        params.method = 'GET';
    };

    //direct_messages
    this.direct_messages = function(params) {
        params.url = 'http://api.twitter.com/1/direct_messages.json';
        params.method = 'GET';
        return self.callApi(params);
    };
    //direct_messages.sent
    this.direct_messages_sent = function(params) {
        params.url = 'http://api.twitter.com/1/direct_messages/sent.json';
        params.method = 'GET';
        return self.callApi(params);
    };
    //direct_messages.new
    this.direct_messages_new = function(params) {
        params.url = 'http://api.twitter.com/1/direct_messages/new.json';
        params.method = 'POST';
        return self.callApi(params);
    };

    //friendships.create
    this.friendships_create = function(params) {
        params.url = 'http://api.twitter.com/1/friendships/create.json';
        params.method = 'GET';
        return self.callApi(params);
    };
    //friendships.destroy
    this.friendships_destroy = function(params) {
        params.url = 'http://api.twitter.com/1/friendships/destroy/:id.json';
        params.method = 'GET';
        return self.callApi(params);
    };
    //friendships.exists
    this.friendships_exists = function(params) {
        params.url = 'http://api.twitter.com/1/friendships/exists.json';
        params.method = 'GET';
        return self.callApi(params);
    };
    //friendships.show
    this.friendships_show = function(params) {
        params.url = 'http://api.twitter.com/1/friendships/show.json';
        params.method = 'GET';
        return self.callApi(params);
    };
    //friendships.incoming
    this.friendships_incoming = function(params) {
        params.url = 'http://api.twitter.com/1/friendships/incoming.json';
        params.method = 'GET';
        return self.callApi(params);
    };

    //account/verify_credentials
    this.account_verify_credentials = function(params) {
        params.url = 'http://api.twitter.com/1/account/verify_credentials.json';
        params.method = 'GET';
        return self.callApi(params);
    };
    //account.rate_limit_status
    this.account_rate_limit_status = function(params) {
        params.url = 'http://api.twitter.com/1/account/rate_limit_status.json';
        params.method = 'GET';
        return self.callApi(params);
    };
    //account.end_session
    this.account_end_session = function(params) {
        params.url = 'http://api.twitter.com/1/account/end_session.json';
        params.method = 'POST';
        return self.callApi(params);
    };
    //account.update_delivery_device
    this.account_update_delivery_device = function(params) {
        params.url = 'http://api.twitter.com/1/account/update_delivery_device.json';
        params.method = 'POST';
        return self.callApi(params);
    };
    //account.update_profile_colors
    this.account_update_profile_colors = function(params) {
        params.url = 'http://api.twitter.com/1/account/update_profile_colors.json';
        params.method = 'POST';
        return self.callApi(params);
    };
    //account.update_profile_image
    this.account_update_profile_image = function(params) {
        params.url = 'http://api.twitter.com/1/account/update_profile_image.json';
        params.method = 'POST';
        return self.callApi(params);
    };
    //account.update_profile_background_image
    this.account_update_profile_background_image = function(params) {
        params.url = 'http://api.twitter.com/1/account/update_profile_background_image.json';
        params.method = 'POST';
        return self.callApi(params);
    };

    //favorites.create
    this.favorites = function(params) {
        params.url = 'http://api.twitter.com/1/favorites.json';
        params.method = 'GET';
        return self.callApi(params);
    };
    //favorites.create
    this.favorites_create = function(params) {
        params.url = 'http://api.twitter.com/1/favorites/create/:id.json';
        params.method = 'POST';
        return self.callApi(params);
    };
    //favorites.destroy
    this.favorites_destroy = function(params) {
        params.url = 'http://api.twitter.com/1/favorites/destroy:id.json';
        params.method = 'POST';
        return self.callApi(params);
    };

    //blocks.create
    this.blocks_create = function(params) {
        params.url = 'http://api.twitter.com/1/blocks/create.json';
        params.method = 'POST';
        return self.callApi(params);
    };

    //blocks.destroy
    this.blocks_destroy = function(params) {
        params.url = 'http://api.twitter.com/1/blocks/destroy.json';
        params.method = 'POST';
        return self.callApi(params);
    };
    //blocks.exists
    this.blocks_exists = function(params) {
        params.url = 'http://api.twitter.com/1/blocks/exists.json';
        params.method = 'GET';
        return self.callApi(params);
    };
    //blocks.blocking
    this.blocks_blocking = function(params) {
        params.url = 'http://api.twitter.com/1/blocks/blocking.json';
        params.method = 'GET';
        return self.callApi(params);
    };
    //blocks.blocking_ids
    this.blocks_blocking_ids = function(params) {
        params.url = 'http://api.twitter.com/1/blocks/blocking/:ids.json';
        params.method = 'GET';
        return self.callApi(params);
    };

    // report_spam
    this.report_spam = function(params) {
        params.url = 'http://api.twitter.com/1/report_spam.json';
        params.method = 'POST';
        return self.callApi(params);
    };

    //saved_searches
    this.saved_searches = function(params) {
        params.url = 'http://api.twitter.com/1/saved_searches.json';
        params.method = 'GET';
        return self.callApi(params);
    };
    //saved_searches.show
    this.saved_searches_show = function(params) {
        params.url = 'http://api.twitter.com/1/saved_searches/show.json';
        params.method = 'GET';
        return self.callApi(params);
    };
    //saved_searches.create
    this.saved_searches_create = function(params) {
        params.url = 'http://api.twitter.com/1/saved_searches/create.json';
        params.method = 'POST';
        return self.callApi(params);
    };
    //saved_searches.delete
    this.saved_searches_delete = function(params) {
        params.url = 'http://api.twitter.com/1/saved_searches/destroy.json';
        params.method = 'POST';
        return self.callApi(params);
    };

    //geo.search
    this.geo_search = function(params) {
        params.url = 'http://api.twitter.com/1/geo/search.json';
        params.method = 'GET';
        return self.callApi(params);
    };
    //geo.similar_places
    this.geo_similar_places = function(params) {
        params.url = 'http://api.twitter.com/1/geo/similar_places.json';
        params.method = 'GET';
        return self.callApi(params);
    };
    //geo.reverse_geocode
    this.geo_reverse_geocode = function(params) {
        params.url = 'http://api.twitter.com/1/geo/reverse_geocode.json';
        params.method = 'GET';
        return self.callApi(params);
    };
    //geo.id.place
    this.geo_id_place = function(params) {
        params.url = 'http://api.twitter.com/1/geo/id/:place_id.json';
        params.method = 'GET';
        return self.callApi(params);
    };
};