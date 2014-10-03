/**
 * @Author: Lorenzo Bertacchi (www.lorenzobertacchi.it)
 */

'use strict';

var module = angular.module('ng-facebook-api', []);


module.provider('facebook',function (){
	var config = {};
	
	this.setInitParams = function(appId,status,xfbml,cookie,apiVersion){
		config = {
				appId      : appId,
			    status     : status,
			    xfbml      : xfbml,
			    cookie     : cookie,
			    version    : apiVersion
		}
	}
	
	
	this.setAppId = function(appId){
		config.appId = appId;
	}
	
	this.setApiVersion = function(apiVersion){
		config.version = apiVersion;
	}
	
	this.setCookie = function(cookie){
		config.cookie = cookie;
	}
	
	var sdkInit = function($q){
		var def=$q.defer();
		if(typeof window.FB == 'undefined'){
			 window.fbAsyncInit = function() {
				 FB.init(config);
				 def.resolve(true);
			 };
		 }else{
			 FB.init(config);
			 return $q.when(true);
		 }
		 return def.promise;
	}
	
	this.$get = function(FacebookService, $q){
		
		sdkInit($q).then(function(){
			var providerFunc = {
					getConfig : function(){
						return config;
					}
			} ;
			angular.extend(providerFunc,FacebookService);
			return providerFunc;
		});
		
	}
	
});

module.service('FacebookService', function FacebookService($q) {
	  
	  var settings = {};
	  var currentUserAuthResponse = null;
	  var API_METHOD = {GET: "get", POST: "post", DELETE: "delete"}
	  
	  var setPermissions = function(permissions){
		  settings.permissions = permissions;
	  }
	  
	  
	  var getUser = function(fields){
		  var deferred = $q.defer();
		  if(typeof(fields) === "undefined"){
			  fields = {};
		  }
		  api("/me/",API_METHOD.GET,fields).then(function(response){
			  deferred.resolve({fields:response,authResponse: currentUserAuthResponse});
		  },function(err){
			  deferred.reject(err);
		  });
		  
		  return deferred.promise;
	  }
	  
	  var apiWrapper = function(path,method,params){
		  var deferred = $q.defer();
		  FB.api(path,method,params, function(response){
			  if (!response || response.error) {
				  deferred.reject(response);
			  }else{
				  deferred.resolve(response);
			  }
		  }); 
		  return deferred.promise;
	  }
	  
	  var api = function(path, method, params){
		  var deferred = $q.defer();
		  
		  if(typeof(method) === "undefined"){
			  method: API_METHOD.GET;
		  }
		  
		  if(typeof(params) === "undefined"){
			  params = {};
		  }
		  
		  if(currentUserAuthResponse != null){
			  deferred.promise = apiWrapper(path, method, params);
				
		  }else{
			  deferred.promise = checkLoginStatus().then( 
					  function(resp){
						  return apiWrapper(path, method, params);
					  },
					  function(err){
						  var r = $q.defer();
						  r.reject(err);
						  return r.promise;
					  }
			  );
		  }
		 return deferred.promise;
	  }
	  
	  
	  var checkLoginStatus = function(){
		  var deferred = $q.defer();
		  
		  FB.getLoginStatus( function (response){
			  if (response.status === 'connected') {
				  currentUserAuthResponse = response.authResponse;
				  deferred.resolve(currentUserAuthResponse);
			  } else {
				  deferred.promise = doLogin();
			  } 
		  });
		  
		  return deferred.promise;
	  }
	  
	  var doLogin = function(){
		  var deferred = $q.defer();
		  FB.login(
				function(response){
					if(response.authResponse){
						currentUserAuthResponse = response.authResponse;
						deferred.resolve(true);
					}else{
						deferred.reject("Not authorized!");
					}
				},
				{
				   scope: settings.permissions
				}
			);
		  return deferred.promise;
	  }
	  
	  return {
		  API_METHOD: API_METHOD,
		  api: api,
		  checkLoginStatus: checkLoginStatus,
		  getUser: getUser,
		  setPermissions : setPermissions
	  }
  });


module.run(['$rootScope', '$window', 'facebook', function($rootScope, $window, facebookProvider) {
}]);