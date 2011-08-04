twitter\_api.js
------------

This is a library to call [twitter api][twitterapi] from [titanium mobile][tm] project.

  [twitterapi]: http://dev.twitter.com/doc
  [tm]: http://www.appcelerator.com/products/titanium-mobile-application-development/

How are this library related to 'Twitter oAuth Implementation for Titanium Mobile'
------------

 ['Twitter oAuth Implementation for Titanium Mobile'][oauth_link] by [David Riccitelli][david] is great library.

  [oauth_link]: http://developer.appcelerator.com/blog/2010/07/twitter-oauth-implementation-for-titanium-mobile.html
  [david]: http://ziodave.tumblr.com/

 The problem is, as far as I saw, we can't use GET method by that library, can we?
 It means I can't get the twitter timeline.

 So I have forked the OAuth\_adapter to use POST and GET method.

 Also, I wrote twitter\_api.js which is more user-friendly wrapper class.

What's need
------------

 Same as original oauth\_adapter.js, we need [oauth.js][oauth_js] and [sha1.js][sha1_js].
  [oauth_js]: http://oauth.googlecode.com/svn/code/javascript/oauth.js
  [sha1_js]: http://oauth.googlecode.com/svn/code/javascript/sha1.js
put twitter\_api.js,oauth\_adapter.js,oauth.js and sha1.js to yourproject/Resources/lib/

How to use
------------

	Ti.include("lib/twitter_api.js");
	//initialization
	Ti.App.twitterApi = new TwitterApi({
		consumerKey:'YOUR CONSUMER KEY of twitter API',
		consumerSecret:'YOUR SECRET of twitter API'
	});
	var twitterApi = Ti.App.twitterApi;
	twitterApi.init(); 

When you call twitterApi.init, the library open a web browser UI to request the oauth authorization process if needs.

	//status update
	twitterApi.statuses_update({
		onSuccess: function(responce){
			alert('tweet success');
			Ti.API.info(responce);
		},
		onError: function(error){
			Ti.API.error(error);
		},
		parameters:{status: 'yah! this is my first tweet from twitter_api.js! '}
	});

	//get tweets
	twitterApi.statuses_home_timeline({
		onSuccess: function(tweets){
			for(var i=0;i<tweets.length;i++){
				var tweet = tweets[i];
				// now you can use tweet.user.name, tweet.text, etc..
			}
		},
		onError: function(error){
			Ti.API.error(error);
		}
	});

Some API has optional parameters.

	twitterApi.users_show({
		user_id:'5574572', //parameters.
		onSuccess: function(ret){
			Ti.API.debug(ret);
		}
	});

license
------------

  [Apache License 2.0][al2]

  [al2]:http://www.apache.org/licenses/LICENSE-2.0

Donation
------------

if you like the OAuth Adapter, consider donating to [David][donation].

  [donation]:https://www.paypal.com/cgi-bin/webscr?cmd=_donations&business=T5HUU4J5EQTJU&lc=IT&item_name=OAuth%20Adapter&currency_code=USD&bn=PP%2dDonationsBF%3abtn_donate_LG%2egif%3aNonHosted

Japanese
------------

 英語は疲れますね:-)

 Titanium mobile から twitter APIを呼び出すためのラッパークラスです。
同様の機能を持つものとして、[David Riccitelli][david] の['Twitter oAuth Implementation for Titanium Mobile'][oauth_link]が有名なのですが、
このライブラリ、GETができなかったり、APIの呼び出しが終わるたびに毎回ポップアップを出さないといけないとか、いろいろ問題があったので
[titanium-hatena-oauth-sample][titanium-hatena-oauth-sample]を参考に書き換えました。

  [oauth_link]: http://developer.appcelerator.com/blog/2010/07/twitter-oauth-implementation-for-titanium-mobile.html
  [david]: http://ziodave.tumblr.com/
  [titanium-hatena-oauth-sample]: https://github.com/hatena/titanium-hatena-oauth-sample

ついでに、twitterAPIを簡単に呼び出せるようにしたtwitter\_api.jsというラッパークラスを作りました。
APIドキュメントに書いてある名前と引数でAPIを呼び出すことができて、onSuccessとか、onErrorといった普通のコールバック関数で処理を行うことができます。
詳しくは上記(英語の部分の)サンプルコードをご覧ください。
