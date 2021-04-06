module.exports = function(RED) {
	"use strict";
	var request = require("request");
	var EventEmitter = require("events");
	var myEvents = new EventEmitter();
	
	function CompassQuery(config) {
		this.username = config.username;//Copyright 2021 HCL Technologies.
		this.password = config.password;//Copyright 2021 HCL Technologies.
		this.host = config.host;//Copyright 2021 HCL Technologies.
		this.port = config.port;//Copyright 2021 HCL Technologies.
		this.repo = config.repo;//Copyright 2021 HCL Technologies.
		this.db = config.db;//Copyright 2021 HCL Technologies.
		this.file = config.file;//Copyright 2021 HCL Technologies.
		this.dbID = config.dbID;//Copyright 2021 HCL Technologies.
		this.queryDefVal = config.queryDefVal;//Copyright 2021 HCL Technologies.
		this.appList = config.appList;//Copyright 2021 HCL Technologies.
		this.app = config.app;//Copyright 2021 HCL Technologies.
        this.queryList = config.queryList;//Copyright 2021 HCL Technologies.
        this.rootFolders = config.rootFolders;//Copyright 2021 HCL Technologies.
        this.folderDbId = config.folderDbId;//Copyright 2021 HCL Technologies.
		
		RED.nodes.createNode(this,config);
		var node = this;
		// debug set to true when messages are to be logged
		const debug = false;

		node.on('input', function(msg) {
			// Messages will only be logged if debug flag is true
			function log(message) {
				if(debug) {
					console.log(message);
				}
			}
			// remove all listeners
			myEvents.removeAllListeners();
			node.status({fill:"blue",shape:"dot",text:"compass-query.status.requesting"});
			if(msg.payload || (Array.isArray(msg.payload) && msg.payload.length > 0)) {
				var	username = msg.payload.username || node.username;//Copyright 2021 HCL Technologies.
				var password = msg.payload.password || node.password || " ";//Copyright 2021 HCL Technologies.
				var host = msg.payload.host || node.host;//Copyright 2021 HCL Technologies.
				var port = parseInt(msg.payload.port, 10) || parseInt(node.port, 10) || 0;//Copyright 2021 HCL Technologies.
				var repo = msg.payload.repo || node.repo;//Copyright 2021 HCL Technologies.
				var db = msg.payload.db || node.db;//Copyright 2021 HCL Technologies.
				var dbID = node.dbID;//Copyright 2021 HCL Technologies.
                var queryPath = msg.payload.queryPath;//Copyright 2021 HCL Technologies.
				var querydbID = null;//Copyright 2021 HCL Technologies.
				var queryDefVal = msg.payload.queryDef || node.queryDefVal;//Copyright 2021 HCL Technologies.

				//Copyright 2021 HCL Technologies.
				if(port === 0) {
					msg.payload = "Error parsing port. Please enter a valid port integer.";
					msg.statusCode = 400;
					node.send(msg);
				}

				//Copyright 2021 HCL Technologies.
				// Checking for missing input parameters 
				if(username && password && host && port && repo && db && (dbID || queryPath)) {
					// first retrieve the token
					var url = "https://" + host + ":" + port + "/ccmweb/rest/authenticate";
					// Check for blank password credentials
					if(password == " ") {
						var tokenOptions = {
							'method': 'POST',
							'url': url,
							body: JSON.stringify({"username": username, "password": "", "repo": repo, "db": db}),
							'headers': {
								'Content-Type': 'application/json'
							}
						};
					} else {
						var tokenOptions = {
							'method': 'POST',
							'url': url,
							body: JSON.stringify({"username": username, "password": password, "repo": repo, "db": db}),
							'headers': {
								'Content-Type': 'application/json'
							}
						};
					}
					
					request(tokenOptions, (err, res, data) => {
						if(err) {
							var errorMsg;
							log("The error thrown is: " + err);
							if(err.code === 'ENOTFOUND') {
								errorMsg = "The domain you are trying to access is unavailable or invalid. Error code returned was ENOTFOUND.";
								log(errorMsg);
								node.error(RED._(errorMsg));//Copyright 2021 HCL Technologies.
								node.status({fill:"red", shape:"dot", text:"compass-query.status.error.request-failed"});
								msg.payload = errorMsg + " : " + url;
								msg.statusCode = 409;
							} else if (err.code === 'ETIMEDOUT') {
								errorMsg = "The request timed out. Request failed to retrieve query information.";
								node.error(RED._("common.notification.errors.no-response"), msg);
								setTimeout(function () {
								  node.status({
									fill: "red",
									shape: "ring",
									text: "common.notification.errors.no-response"
								  });
								}, 10);
								msg.payload = errorMsg + " : " + url;
								log(errorMsg);
								msg.statusCode = 408;
							} else if (err.code === 'ECONNREFUSED') {
								errorMsg = "Connection refused. Unable to connect to the specified port. Error code returned was ECONNREFUSED.";
								log(errorMsg);
								node.error(RED._(errorMsg));//Copyright 2021 HCL Technologies.
								node.status({fill:"red", shape:"dot", text:"compass-query.status.error.request-failed"});
								msg.payload = errorMsg + " : " + url;
								msg.statusCode = 409;
							} else if(err.code === 'ECONNRESET') {
								errorMsg = "Connection failed. Unable to connect to Compass. Error code returned was ECONNRESET.";
								log(errorMsg);
								node.error(RED._(errorMsg));//Copyright 2021 HCL Technologies.
								node.status({fill:"red", shape:"dot", text:"compass-query.status.error.request-failed"});
								msg.payload = errorMsg + " : " + url;
								msg.statusCode = 409;
							} else {
								node.error(err, msg);
            					msg.payload = err.toString() + " : " + url;
            					node.status({
              						fill: "red",
              						shape: "ring",
              						text: err.code
										});
								msg.statusCode = 409;
							}
							node.send(msg);
						} else if(!err && res.statusCode == 201) {
							var stringified = JSON.stringify(data);
							var result = JSON.parse(stringified);
							myEvents.token = result;
							log("Token is : " + myEvents.token);
							
							// if token was successfully retrieved then signal for queryDbId to be retrieved from queryPath
							myEvents.emit('getRootFolder');
					 	} else {
							msg.payload = data;
							msg.headers = res.headers;
							msg.statusCode = res.statusCode;

							if(res.statusCode == 401) {
								var errorMsg = "Request returned a status code of 401. Unauthorized. Request failed. Check that credentials provided are valid.";
								log(errorMsg);
								node.error(RED._(errorMsg));//Copyright 2021 HCL Technologies.
								node.status({fill:"red", shape:"dot", text:"compass-query.status.error.request-failed"});
							} else if(res.statusCode == 400) {
								var errorMsg = "Request returned a status code of 400. Invalid login request. Request failed. Check provided input.";
								log(errorMsg);
								node.error(RED._(errorMsg));//Copyright 2021 HCL Technologies.
								node.status({fill:"red", shape:"dot", text:"compass-query.status.error.request-failed"});
							} else if(res.statusCode == 403) {
								var errorMsg = "Request returned a status code of 403. Forbidden. Request failed.";
								log(errorMsg);
								node.error(RED._(errorMsg));//Copyright 2021 HCL Technologies.
								node.status({fill:"red", shape:"dot", text:"compass-query.status.error.request-failed"});
							} else if(res.statusCode == 404) {
								var errorMsg = "Request returned a status code of 404. Not found. Request failed.";
								log(errorMsg);
								node.error(RED._(errorMsg));//Copyright 2021 HCL Technologies.
								node.status({fill:"red", shape:"dot", text:"compass-query.status.error.request-failed"});
							}
							node.send(msg);
					 	} 
					});
					
				} else {
					// error: missing required parameters occurred
					var errorMsg = "Missing required parameters. Please enter input and try again.";
					msg.payload = errorMsg;
					msg.res.get = errorMsg;
					log(errorMsg);
					node.error(RED._(errorMsg));//Copyright 2021 HCL Technologies.
					node.status({fill:"red", shape:"dot", text:"compass-query.status.error.missing-input"});
					msg.statusCode = 400;
					node.send(msg);
				}
				
				//Copyright 2021 HCL Technologies.
				 myEvents.once('getQueryDef', function getQueryDef() {
					var bearerToken = JSON.parse(myEvents.token);
					var queryDefsUrl = "https://" + host + ":" + port+ "/ccmweb/rest/repos/" + repo + "/databases/" + db + "/workspace/queryDefs/" + myEvents.querydbId;
					var queryDefOptions = {
						'method': 'GET',
						'url': queryDefsUrl,
						body: JSON.stringify({"database": db, "repo": repo, "query_dbid": dbID}),
						'headers': {
							'Content-Type': 'application/json',
							'Authorization': 'Bearer ' + bearerToken.token,
						}
					}
					
					request(queryDefOptions, (err, res, data) => {
						if(err) {
							var errorMsg;
							log("The error thrown is: " + err);
							if(err.code === 'ENOTFOUND') {
								errorMsg = "The domain you are trying to access is unavailable or invalid. Error code returned was ENOTFOUND.";
								log(errorMsg);
								node.error(RED._(errorMsg));//Copyright 2021 HCL Technologies.
								node.status({fill:"red", shape:"dot", text:"compass-query.status.error.request-failed"});
								msg.payload = errorMsg + " : " + url;
								msg.statusCode = 409;
							} else if (err.code === 'ETIMEDOUT') {
								errorMsg = "The request timed out. Request failed to retrieve query information.";
								node.error(RED._("common.notification.errors.no-response"), msg);//Copyright 2021 HCL Technologies.
								setTimeout(function () {
								  node.status({
									fill: "red",
									shape: "ring",
									text: "common.notification.errors.no-response"
								  });
								}, 10);
								msg.payload = errorMsg + " : " + url;
								log(errorMsg);
								msg.statusCode = 408;
							} else if (err.code === 'ECONNREFUSED') {
								errorMsg = "Connection refused. Unable to connect to the specified port. Error code returned was ECONNREFUSED.";
								log(errorMsg);
								node.error(RED._(errorMsg));//Copyright 2021 HCL Technologies.
								node.status({fill:"red", shape:"dot", text:"compass-query.status.error.request-failed"});
								msg.payload = errorMsg + " : " + url;
								msg.statusCode = 409;
							} else if(err.code === 'ECONNRESET') {
								errorMsg = "Connection failed. Unable to connect to Compass. Error code returned was ECONNRESET.";
								log(errorMsg);
								node.error(RED._(errorMsg));//Copyright 2021 HCL Technologies.
								node.status({fill:"red", shape:"dot", text:"compass-query.status.error.request-failed"});
								msg.payload = errorMsg + " : " + url;
								msg.statusCode = 409;
							} else {
								node.error(err, msg);//Copyright 2021 HCL Technologies.
								msg.payload = err.toString() + " : " + url;
								node.status({
									  fill: "red",
									  shape: "ring",
									  text: err.code
										});
								msg.statusCode = 409;
							}
							node.send(msg);

						} else if(!err && res.statusCode == 200) {
							var stringified = JSON.stringify(data);
							var result = JSON.parse(stringified);
							log(result);
							myEvents.columns = result;
							myEvents.emit('updateMsg');
						} else {
							msg.payload = data;
							msg.headers = res.headers;
							msg.statusCode = res.statusCode;
	   
							if(res.statusCode == 401) {
								var errorMsg = "Request returned a status code of 401. Unauthorized. Request failed. Check that credentials provided are valid.";
								log(errorMsg);
								node.error(RED._(errorMsg));//Copyright 2021 HCL Technologies.
								node.status({fill:"red", shape:"dot", text:"compass-query.status.error.request-failed"});
							} else if(res.statusCode == 400) {
								var errorMsg = "Request returned a status code of 400. Invalid login request. Request failed. Check provided input.";
								log(errorMsg);
								node.error(RED._(errorMsg));//Copyright 2021 HCL Technologies.
								node.status({fill:"red", shape:"dot", text:"compass-query.status.error.request-failed"});
							} else if(res.statusCode == 403) {
								var errorMsg = "Request returned a status code of 403. Forbidden. Request failed.";
								log(errorMsg);
								node.error(RED._(errorMsg));//Copyright 2021 HCL Technologies.
								node.status({fill:"red", shape:"dot", text:"compass-query.status.error.request-failed"});
							} else if(res.statusCode == 404) {
								var errorMsg = "Request returned a status code of 404. Not found. Request failed.";
								log(errorMsg);
								node.error(RED._(errorMsg));//Copyright 2021 HCL Technologies.
								node.status({fill:"red", shape:"dot", text:"compass-query.status.error.request-failed"});
							}
							// remove listener before sending msg
							myEvents.removeListener('getdbID', getdbID);
							node.send(msg);
						}
					});

				});

				//Copyright 2021 HCL Technologies.
                myEvents.once('getRootFolder', function getRootFolder() {
                    if(queryPath) {
                        var bearerToken = JSON.parse(myEvents.token);
                        myEvents.pathArray = queryPath.split("/");
                        var rootFolderUrl = "https://"+host+":"+port+"/ccmweb/rest/repos/"+repo+"/databases/"+db+"/workspace/folders";
                        var rootFolderOptions = {
                            'method': 'GET',
                            'url': rootFolderUrl,
                            'headers': {
                                'Authorization': 'Bearer ' + bearerToken.token,
								'Content-Type': 'application/json'
							},
							body: JSON.stringify({"repo": repo, "db": db})
                        };
                        request(rootFolderOptions, function(err, res, data) {
                            if(err) {
								var errorMsg;
								log("The error thrown is: " + err);
								if(err.code === 'ENOTFOUND') {
									errorMsg = "The domain you are trying to access is unavailable or invalid. Error code returned was ENOTFOUND.";
									log(errorMsg);
									node.error(RED._(errorMsg));//Copyright 2021 HCL Technologies.
									node.status({fill:"red", shape:"dot", text:"compass-query.status.error.request-failed"});
									msg.payload = errorMsg + " : " + url;
									msg.statusCode = 409;
								} else if (err.code === 'ETIMEDOUT') {
									errorMsg = "The request timed out. Request failed to retrieve query information.";
									node.error(RED._("common.notification.errors.no-response"), msg);//Copyright 2021 HCL Technologies.
									setTimeout(function () {
									  node.status({
										fill: "red",
										shape: "ring",
										text: "common.notification.errors.no-response"
									  });
									}, 10);
									msg.payload = errorMsg + " : " + url;
									log(errorMsg);
									msg.statusCode = 408;
								} else if (err.code === 'ECONNREFUSED') {
									errorMsg = "Connection refused. Unable to connect to the specified port. Error code returned was ECONNREFUSED.";
									log(errorMsg);
									node.error(RED._(errorMsg));//Copyright 2021 HCL Technologies.
									node.status({fill:"red", shape:"dot", text:"compass-query.status.error.request-failed"});
									msg.payload = errorMsg + " : " + url;
									msg.statusCode = 409;
								} else if(err.code === 'ECONNRESET') {
									errorMsg = "Connection failed. Unable to connect to Compass. Error code returned was ECONNRESET.";
									log(errorMsg);
									node.error(RED._(errorMsg));//Copyright 2021 HCL Technologies.
									node.status({fill:"red", shape:"dot", text:"compass-query.status.error.request-failed"});
									msg.payload = errorMsg + " : " + url;
									msg.statusCode = 409;
								} else {
									node.error(err, msg);//Copyright 2021 HCL Technologies.
									msg.payload = err.toString() + " : " + url;
									node.status({
										  fill: "red",
										  shape: "ring",
										  text: err.code
											});
									msg.statusCode = 409;
								}
								// remove listener before sending msg
								myEvents.removeListener('getRootFolder', getRootFolder);
								node.send(msg);
							} else if(!err && res.statusCode == 200) {
								log("Root folder was found successfully.");
                                var json = JSON.parse(res.body);
                                var index;
                                for(index in json) {
                                    if(json[index].pathName === myEvents.pathArray[0]) {
                                        myEvents.children = json[index].children;
                                    }
                                }
                                if(myEvents.children) {
									myEvents.pathArrayIndex = 1;
									log("Children of root folder have been retrieved. Now we will try and find the query dbId of the query in the specified path.");
                                    myEvents.emit("getQueryDbId");
                                } else {
                                    var errorMsg = "An error occurred during the request. Could not find specified query. Invalid query path.";
									log("Could not find the specified query. Please enter a valid query path.");
									queryPath = null;
									dbID = null;
									node.error(RED._(errorMsg));//Copyright 2021 HCL Technologies.
									node.status({fill:"red", shape:"dot", text:"compass-query.status.error.request-failed"});
									msg.payload = errorMsg;
									msg.statusCode = 404;
									// remove listener before sending msg
                                    myEvents.removeListener('getRootFolder', getRootFolder);
									node.send(msg);
                                }
                            } else {
								msg.payload = data;
								msg.headers = res.headers;
								msg.statusCode = res.statusCode;
		   
								if(res.statusCode == 401) {
									var errorMsg = "Request returned a status code of 401. Unauthorized. Request failed. Check that credentials provided are valid.";
									log(errorMsg);
									node.error(RED._(errorMsg));//Copyright 2021 HCL Technologies.
									node.status({fill:"red", shape:"dot", text:"compass-query.status.error.request-failed"});
								} else if(res.statusCode == 400) {
									var errorMsg = "Request returned a status code of 400. Invalid login request. Request failed. Check provided input.";
									log(errorMsg);
									node.error(RED._(errorMsg));//Copyright 2021 HCL Technologies.
									node.status({fill:"red", shape:"dot", text:"compass-query.status.error.request-failed"});
								} else if(res.statusCode == 403) {
									var errorMsg = "Request returned a status code of 403. Forbidden. Request failed.";
									log(errorMsg);
									node.error(RED._(errorMsg));//Copyright 2021 HCL Technologies.
									node.status({fill:"red", shape:"dot", text:"compass-query.status.error.request-failed"});
								} else if(res.statusCode == 404) {
									var errorMsg = "Request returned a status code of 404. Not found. Request failed.";
									log(errorMsg);
									node.error(RED._(errorMsg));//Copyright 2021 HCL Technologies.
									node.status({fill:"red", shape:"dot", text:"compass-query.status.error.request-failed"});
								}
								// remove listener before sending msg
								myEvents.removeListener('getRootFolder', getRootFolder);
								node.send(msg);
							}
                        })
                    } else if(dbID){
						querydbID = dbID;
						myEvents.emit('getResult');
                    }
                });

                //Copyright 2021 HCL Technologies.
                myEvents.on('getQueryDbId', function getQueryDbId() {
					var childFound = false;
					var i = myEvents.pathArrayIndex;
                	while(i < myEvents.pathArray.length && !childFound) {
                        var index = 0;
                        for(index in myEvents.children) {
                            if(myEvents.children[index].name === myEvents.pathArray[i]) {
								childFound = true;
                                if(myEvents.children[index].workspaceItemType === "WORKSPACE_QUERY") {
                                    myEvents.querydbId = myEvents.children[index].dbId;
									querydbID = myEvents.querydbId;
									// if querydbId was found then get the result set
									if(queryDefVal) {
										log("Query dbId was found. Now retrieving query definition.");
										myEvents.emit('getQueryDef');
									} else {
										log("Query dbId was found. Now retrieving query result set.");
										myEvents.emit('getResult');
									}
                                } else {
									// if child was found but it is not a query then set the folderDbId variable and 
									// signal for the folder to be retrieved
									myEvents.folderDbId = myEvents.children[index].dbId;
									myEvents.pathArrayIndex = i + 1;
									log("Next folder in the path was found. FolderDbId is being set.");
									myEvents.emit('getFolder');
								}
								return;
							} 
						}
						i++;
					}
					
					if(!childFound) {
						// if query was not found in the path specified, indicate that path was not valid
						var errorMsg = "An error occurred during the request. Could not find query in the path provided. Invalid query path.";
						log("Could not find the query in the provided query path. Please enter a valid query path.");
						queryPath = null;
						dbID = null;
						node.error(RED._(errorMsg));//Copyright 2021 HCL Technologies.
						node.status({fill:"red", shape:"dot", text:"compass-query.status.error.request-failed"});
						msg.payload = errorMsg;
						msg.statusCode = 404;
						// remove listener before sending msg
						myEvents.removeListener('getQueryDbId', getQueryDbId);
						node.send(msg);
						return;
					}
				});
				
				 //Copyright 2021 HCL Technologies.
				 myEvents.on('getFolder', function getFolder() {
					var bearerToken = JSON.parse(myEvents.token);
					var folderDbId = myEvents.folderDbId;
					var getFolderUrl = "https://"+host+":"+port+"/ccmweb/rest/repos/"+repo+"/databases/"+db+"/workspace/folders/" + folderDbId;
					var getFolderOptions = {
						'method': 'GET',
						'url': getFolderUrl,
						'headers': {
							'Authorization': 'Bearer ' + bearerToken.token,
							'Content-Type': 'application/json'
						},
						body: JSON.stringify({"repo": repo, "db": db, "folder_dbid": folderDbId})
					};
	
					request(getFolderOptions, function(err, res, data) {
						if(err) {
							var errorMsg;
							log("The error thrown is: " + err);
							if(err.code === 'ENOTFOUND') {
								errorMsg = "The domain you are trying to access is unavailable or invalid. Error code returned was ENOTFOUND.";
								log(errorMsg);
								node.error(RED._(errorMsg));//Copyright 2021 HCL Technologies.
								node.status({fill:"red", shape:"dot", text:"compass-query.status.error.request-failed"});
								msg.payload = errorMsg + " : " + url;
								msg.statusCode = 409;
							} else if (err.code === 'ETIMEDOUT') {
								errorMsg = "The request timed out. Request failed to retrieve query information.";
								node.error(RED._("common.notification.errors.no-response"), msg);//Copyright 2021 HCL Technologies.
								setTimeout(function () {
								node.status({
									fill: "red",
									shape: "ring",
									text: "common.notification.errors.no-response"
								});
								}, 10);
								msg.payload = errorMsg + " : " + url;
								log(errorMsg);
								msg.statusCode = 408;
							} else if (err.code === 'ECONNREFUSED') {
								errorMsg = "Connection refused. Unable to connect to the specified port. Error code returned was ECONNREFUSED.";
								log(errorMsg);
								node.error(RED._(errorMsg));//Copyright 2021 HCL Technologies.
								node.status({fill:"red", shape:"dot", text:"compass-query.status.error.request-failed"});
								msg.payload = errorMsg + " : " + url;
								msg.statusCode = 409;
							} else if(err.code === 'ECONNRESET') {
								errorMsg = "Connection failed. Unable to connect to Compass. Error code returned was ECONNRESET.";
								log(errorMsg);
								node.error(RED._(errorMsg));//Copyright 2021 HCL Technologies.
								node.status({fill:"red", shape:"dot", text:"compass-query.status.error.request-failed"});
								msg.payload = errorMsg + " : " + url;
								msg.statusCode = 409;
							} else {
								node.error(err, msg);//Copyright 2021 HCL Technologies.
								msg.payload = err.toString() + " : " + url;
								node.status({
									fill: "red",
									shape: "ring",
									text: err.code
								});
								msg.statusCode = 409;
							}
							// remove listener before sending msg
							myEvents.removeListener('getFolder', getFolder);
							node.send(msg);
						} else if(!err && res.statusCode == 200) {
							log("Nested folder in path was retrieved successfully.");
							var json = JSON.parse(res.body);
							if(json.children) {
								// if children were found in the specified folder then compare children to path specified to get query dbid
								myEvents.children = json.children;
								myEvents.emit("getQueryDbId");
							}
						} else {
							msg.payload = data;
							msg.headers = res.headers;
							msg.statusCode = res.statusCode;
	
							if(res.statusCode == 401) {
								var errorMsg = "Request returned a status code of 401. Unauthorized. Request failed. Check that credentials provided are valid.";
								log(errorMsg);
								node.error(RED._(errorMsg));//Copyright 2021 HCL Technologies.
								node.status({fill:"red", shape:"dot", text:"compass-query.status.error.request-failed"});
							} else if(res.statusCode == 400) {
								var errorMsg = "Request returned a status code of 400. Invalid login request. Request failed. Check provided input.";
								log(errorMsg);
								node.error(RED._(errorMsg));//Copyright 2021 HCL Technologies.
								node.status({fill:"red", shape:"dot", text:"compass-query.status.error.request-failed"});
							} else if(res.statusCode == 403) {
								var errorMsg = "Request returned a status code of 403. Forbidden. Request failed.";
								log(errorMsg);
								node.error(RED._(errorMsg));//Copyright 2021 HCL Technologies.
								node.status({fill:"red", shape:"dot", text:"compass-query.status.error.request-failed"});
							} else if(res.statusCode == 404) {
								var errorMsg = "Request returned a status code of 404. Not found. Request failed.";
								log(errorMsg);
								node.error(RED._(errorMsg));//Copyright 2021 HCL Technologies.
								node.status({fill:"red", shape:"dot", text:"compass-query.status.error.request-failed"});
							}
							// remove listener before sending msg
							myEvents.removeListener('getFolder', getFolder);
							node.send(msg);
						}
					});
				 });


				//Copyright 2021 HCL Technologies.
				myEvents.once('getResult', function getResult() {
					var bearerToken = JSON.parse(myEvents.token);
					var url = 'https://'+host+':'+port+'/ccmweb/rest/repos/'+repo+'/databases/'+db+'/workspace/queryDefs/'+querydbID+'/resultsets';
					var resultOptions = {
						'method': 'POST',
						'url': url,
						'headers': {
						'Authorization': 'Bearer ' + bearerToken.token,
						'Content-Type': 'application/json'
						},
						body: JSON.stringify({"repo": repo,"db":db,"query_dbID":querydbID,"resultSetOptions":{"enableRecordCount":true,"convertToLocalTime":true,"maxMultiLineTextLength":20,"maxResultSetRows":2,"pageSize":5}})
					};
					request(resultOptions, function (err, res, data) {
						if(err) {
							var errorMsg;
							log("The error thrown is: " + err);
							if(err.code === 'ENOTFOUND') {
								errorMsg = "The domain you are trying to access is unavailable or invalid. Error code returned was ENOTFOUND.";
								log(errorMsg);
								node.error(RED._(errorMsg));//Copyright 2021 HCL Technologies.
								node.status({fill:"red", shape:"dot", text:"compass-query.status.error.request-failed"});
								msg.payload = errorMsg + " : " + url;
								msg.statusCode = 409;
							} else if (err.code === 'ETIMEDOUT') {
								errorMsg = "The request timed out. Request failed to retrieve query information.";
								node.error(RED._("common.notification.errors.no-response"), msg);//Copyright 2021 HCL Technologies.
								setTimeout(function () {
								  node.status({
									fill: "red",
									shape: "ring",
									text: "common.notification.errors.no-response"
								  });
								}, 10);
								msg.payload = errorMsg + " : " + url;
								log(errorMsg);
								msg.statusCode = 408;
							} else if (err.code === 'ECONNREFUSED') {
								errorMsg = "Connection refused. Unable to connect to the specified port. Error code returned was ECONNREFUSED.";
								log(errorMsg);
								node.error(RED._(errorMsg));//Copyright 2021 HCL Technologies.
								node.status({fill:"red", shape:"dot", text:"compass-query.status.error.request-failed"});
								msg.payload = errorMsg + " : " + url;
								msg.statusCode = 409;
							} else if(err.code === 'ECONNRESET') {
								errorMsg = "Connection failed. Unable to connect to Compass. Error code returned was ECONNRESET.";
								log(errorMsg);
								node.error(RED._(errorMsg));//Copyright 2021 HCL Technologies.
								node.status({fill:"red", shape:"dot", text:"compass-query.status.error.request-failed"});
								msg.payload = errorMsg + " : " + url;
								msg.statusCode = 409;
							} else {
								node.error(err, msg);//Copyright 2021 HCL Technologies.
            					msg.payload = err.toString() + " : " + url;
            					node.status({
              						fill: "red",
              						shape: "ring",
              						text: err.code
										});
								msg.statusCode = 409;
							}
							// remove listener before sending msg
							myEvents.removeListener('getResult', getResult);
							node.send(msg);
						} else if(!err && res.statusCode == 201) {
							var result = JSON.parse(res.body);
							myEvents.resultSet = result;
							log("Result set is: " + myEvents.resultSet);
							myEvents.emit('getFile');
						} else {
							// a different status code was returned 
						   var errorMsg;
						   msg.payload = data;
						   msg.headers = res.headers;
						   msg.statusCode = res.statusCode;
   
						   if(res.statusCode == 401) {
							   errorMsg = "Request returned a status code of 401. Unauthorized. Request failed. Check that credentials provided are valid.";
							   log(errorMsg);
							   node.error(RED._(errorMsg));//Copyright 2021 HCL Technologies.
							   node.status({fill:"red", shape:"dot", text:"compass-query.status.error.request-failed"});
						   } else if(res.statusCode == 400) {
							   errorMsg = "Request returned a status code of 400. Invalid login request. Request failed. Check provided input.";
							   log(errorMsg);
							   node.error(RED._(errorMsg));//Copyright 2021 HCL Technologies.
							   node.status({fill:"red", shape:"dot", text:"compass-query.status.error.request-failed"});
						   } else if(res.statusCode == 403) {
							   errorMsg = "Request returned a status code of 403. Forbidden. Request failed.";
							   log(errorMsg);
							   node.error(RED._(errorMsg));//Copyright 2021 HCL Technologies.
							   node.status({fill:"red", shape:"dot", text:"compass-query.status.error.request-failed"});
						   } else if(res.statusCode == 404) {
							   errorMsg = "Request returned a status code of 404. Not found. Request failed.";
							   log(errorMsg);
							   node.error(RED._(errorMsg));//Copyright 2021 HCL Technologies.
							   node.status({fill:"red", shape:"dot", text:"compass-query.status.error.request-failed"});
						   } 
						   // remove listener before sending msg
						   myEvents.removeListener('getResult', getResult);
						   node.send(msg);
						}
					});
				});

				//Copyright 2021 HCL Technologies.
				myEvents.once('getFile', function getFile(){
					var bearerToken = JSON.parse(myEvents.token);
					var resultID = myEvents.resultSet.result_set_id;
					var url = "https://"+host+":"+port+"/ccmweb/rest/repos/"+repo+"/databases/"+db+"/workspace/queryDefs/"+querydbID+"/resultsets/"+resultID+"/file?fileType=csv";
					var getAsFileOpts = {
						'method': 'GET',
						'url': url,
						'headers': {
							'Authorization': 'Bearer ' + bearerToken.token,
							'Content-Type': 'application/json'
						},
						body: JSON.stringify({
							// db, repo, dbid, resultid, file type
							"repo": repo,
							"db": db,
							"query_dbID": querydbID,
							"result_set_id": resultID,
							"fileType": "csv"
						})
					};
					request(getAsFileOpts, function(err, res){
						if(err) {
							var errorMsg;
							log("The error thrown is: " + err);
							if(err.code === 'ENOTFOUND') {
								errorMsg = "The domain you are trying to access is unavailable or invalid. Error code returned was ENOTFOUND.";
								log(errorMsg);
								node.error(RED._(errorMsg));//Copyright 2021 HCL Technologies.
								node.status({fill:"red", shape:"dot", text:"compass-query.status.error.request-failed"});
								msg.payload = errorMsg + " : " + url;
								msg.statusCode = 409;
							} else if (err.code === 'ETIMEDOUT') {
								errorMsg = "The request timed out. Request failed to retrieve query information.";
								node.error(RED._("common.notification.errors.no-response"), msg);
								setTimeout(function () {
								  node.status({
									fill: "red",
									shape: "ring",
									text: "common.notification.errors.no-response"
								  });
								}, 10);
								msg.payload = errorMsg + " : " + url;
								log(errorMsg);
								msg.statusCode = 408;
							} else if (err.code === 'ECONNREFUSED') {
								errorMsg = "Connection refused. Unable to connect to the specified port. Error code returned was ECONNREFUSED.";
								log(errorMsg);
								node.error(RED._(errorMsg));//Copyright 2021 HCL Technologies.
								node.status({fill:"red", shape:"dot", text:"compass-query.status.error.request-failed"});
								msg.payload = errorMsg + " : " + url;
								msg.statusCode = 409;
							} else if(err.code === 'ECONNRESET') {
								errorMsg = "Connection failed. Unable to connect to Compass. Error code returned was ECONNRESET.";
								log(errorMsg);
								node.error(RED._(errorMsg));//Copyright 2021 HCL Technologies.
								node.status({fill:"red", shape:"dot", text:"compass-query.status.error.request-failed"});
								msg.payload = errorMsg + " : " + url;
								msg.statusCode = 409;
							} else {
								node.error(err, msg);//Copyright 2021 HCL Technologies.
            					msg.payload = err.toString() + " : " + url;
            					node.status({
              						fill: "red",
              						shape: "ring",
              						text: err.code
										});
								msg.statusCode = 409;
							}
							// remove listener before sending msg
							myEvents.removeListener('getFile', getFile);
							node.send(msg);
						} else if(!err && res.statusCode == 200) {
							log(res.body);
							var stringified = JSON.stringify(res.body);
							var result = JSON.parse(stringified);
							myEvents.file = result;
							log(myEvents.file);
							myEvents.emit('updateMsg');
						} else {
						   	msg.payload = data;
						   	msg.headers = res.headers;
							msg.statusCode = res.statusCode;

						   	if(res.statusCode == 401) {
								var errorMsg = "Request returned a status code of 401. Unauthorized. Request failed. Check that credentials provided are valid.";
							   	log(errorMsg);
							   	node.error(RED._(errorMsg));//Copyright 2021 HCL Technologies.
							   	node.status({fill:"red", shape:"dot", text:"compass-query.status.error.request-failed"});
						   	} else if(res.statusCode == 400) {
							   	var errorMsg = "Request returned a status code of 400. Invalid login request. Request failed. Check provided input.";
							   	log(errorMsg);
							   	node.error(RED._(errorMsg));//Copyright 2021 HCL Technologies.
							   	node.status({fill:"red", shape:"dot", text:"compass-query.status.error.request-failed"});
						   	} else if(res.statusCode == 403) {
							   	var errorMsg = "Request returned a status code of 403. Forbidden. Request failed.";
							   	log(errorMsg);
							   	node.error(RED._(errorMsg));//Copyright 2021 HCL Technologies.
							   	node.status({fill:"red", shape:"dot", text:"compass-query.status.error.request-failed"});
						   	} else if(res.statusCode == 404) {
							   	var errorMsg = "Request returned a status code of 404. Not found. Request failed.";
							   	log(errorMsg);
							  	node.status({fill:"red", shape:"dot", text:"compass-query.status.error.request-failed"});
						   	}
						   // remove listener before sending msg
						   myEvents.removeListener('getFile', getFile);
						   node.send(msg);
						}
					});
				});

				//Copyright 2021 HCL Technologies.
				myEvents.once('updateMsg', function updateMsg() {
					node.status({fill:"green",shape:"dot",text:"compass-query.status.completed"});
					msg.statusCode = 201;
					if(queryDefVal) {  
						log(myEvents.columns);
						var columnData = [];
						var cols = JSON.parse(myEvents.columns);
						var index = 0;
						cols.queryFieldDefs.forEach(column => {
							// translate data types
							var dataType;
							// filtering out dbid from being returned as a column
							if(column.fieldType !== "DBID") {
								if(column.dataType === 'PD_C_CHAR' || column.dataType === 'PD_C_LONGVARCHAR' || column.dataType === 'PD_C_LONGVARBINARY') {
									dataType = "string";
								}
								else if(column.dataType === 'PD_C_TIMESTAMP') {
									dataType = "datetime";
								}
								else if(column.dataType === 'PD_C_DOUBLE' || column.dataType === 'PD_C_SLONG') {
									dataType = "float";
								}
								// check to make sure the fieldPathName does not contain "." which Tableau cannot process for column ids
								var columnID = column.fieldPathName.split('.').join('_');
								columnData[index] = {"id": columnID, "alias": column.fieldPathName, "dataType": dataType}
								log(columnData);
								index++;
							}
						});
						var stringified = JSON.stringify(columnData)
						var columnResults = JSON.parse(stringified);
						msg.payload = columnResults;
					}
					else{
						msg.payload = myEvents.file;
					}
					log("Sending msg...");
					node.send(msg);
				});

			} else {
				// if parameters were configured only in node properties then send msg
				if(node.file) {
					node.status({fill:"green",shape:"dot",text:"compass-query.status.completed"});	
					msg.payload = node.file;
					msg.statusCode = 200;
					node.send(msg);
				} else if(node.queryDefVal) {
					node.status({fill:"green",shape:"dot",text:"compass-query.status.completed"});	
					var columnData = [];
					var index = 0;
					var cols = JSON.parse(node.queryDefVal);
					log(JSON.stringify(node.queryDefVal));
					cols.queryFieldDefs.forEach(column => {
						// translate data types
						var dataType;
						// filtering out dbid from being returned as a column
						if(column.fieldType !== "DBID") {
							if(column.dataType === 'PD_C_CHAR' || column.dataType === 'PD_C_LONGVARCHAR' || column.dataType === 'PD_C_LONGVARBINARY') {
								dataType = "string";
							}
							else if(column.dataType === 'PD_C_TIMESTAMP') {
								dataType = "datetime";
							}
							else if(column.dataType === 'PD_C_DOUBLE' || column.dataType === 'PD_C_SLONG') {
								dataType = "float";
							}
							// check to make sure the fieldPathName does not contain "." which Tableau cannot process for column ids
							var columnID = column.fieldPathName.split('.').join('_');
							columnData[index] = {"id": columnID, "alias": column.fieldPathName, "dataType": dataType}
							log(columnData);
							index++;
						}
					});
					var stringified = JSON.stringify(columnData)
					log("Column data is: ");
					log(JSON.stringify(columnData));
					var columnResults = JSON.parse(stringified);
					msg.payload = columnResults;
					msg.statusCode = 200;
					log("Sending msg...");
					node.send(msg);
				} else {
					log("An error occurred during configuration. No input. Please try again.");
					node.status({fill:"red", shape:"dot", text:"compass-query.status.error.missing-input"});
					node.error(RED._("An error occurred during configuration. No input. Please try again."));//Copyright 2021 HCL Technologies.
					msg.payload = "An error occurred during configuration. No input. Please try again.";
					msg.statusCode = 400;
					node.send(msg);
				}
			}
		});
	}
	RED.nodes.registerType("compass-query", CompassQuery);
}