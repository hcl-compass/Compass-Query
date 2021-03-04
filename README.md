# CompassQuery
This repository contains the files necessary to create a Node-RED flow that will extract data from Compass for use in 3rd party software.
## Who is this tutorial for?

This tutorial is for developers who have basic familiarity with Xcode and Compass, and who want to learn about the new Compass REST APIs that come with Compass version 3.0.

## Usage

This app allows the user to login using the username, password, and selected repo. The app then displays the list of defects assigned to the user. A tab bar at the bottom of the screen allows the user to switch to the list of defects reported by the user. The user can swipe left on a specific defect to delete it, and tap the plus icon to create a new defect. The user can tap on a specific defect to view more details about the defect. When viewing a defect, the user has the option to modify, change state, or delete the defect. Notifications are sent to the user when a new defect has been assigned to the user and when any modifications are made to a defect that the user currently owns.

## Getting Started

These instructions will get you a copy of the Xcode project on your Mac for development and testing purposes.

### Prerequisites

Xcode needs to be downloaded from the App Store. It is recommended to use Xcode 11 or later, and macOS 10.14.4 or later.
Compass needs to be installed and the Compass server needs to be running somewhere.


## Build the App

To build the app in Xcode, click on Product in the menu bar and then click on Clean Build Folder.
To run the app in Xcode, click on Product in the menu bar and then click on Run.
To build and then run the app, click on the play icon in the top left corner.

## Install and Update

To run the app in an iOS Simulator in Xcode, pick an iOS 12.0 or later Simulator from the list provided or choose the Download Simulators option. Then, build and run the app.

To install the app on an iPhone, plug in the iPhone into your Mac using a USB cable. In Xcode, select the Additional Simulators option and then click on the Devices tab. The iPhone will appear in the devices list in the left column. Select the iPhone and then build and run the app.

To update the app on an iPhone, plug in the iPhone into your Mac using a USB cable. In Xcode, select the iPhone from the device list and then build and run the app.

Once the app is installed and updated on the iPhone, there is no need to keep the iPhone plugged in to your Mac with a USB cable to use the app.

## License

/*
 
 Copyright 2020 HCL Technologies Ltd.

 Licensed under the Apache License, Version 2.0 (the "License");
 you may not use this file except in compliance with the License.
 You may obtain a copy of the License at

     http://www.apache.org/licenses/LICENSE-2.0

 Unless required by applicable law or agreed to in writing, software
 distributed under the License is distributed on an "AS IS" BASIS,
 WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 See the License for the specific language governing permissions and
 limitations under the License.
 
*/

## Configuration Properties

### Xcode

Select the target and go to the Signing & Capabilities tab. Add the Background Modes capability and select Background fetch and Background processing.

### App

To connect to the Compass server, in the login screen, tap on the gear icon at the top right corner of the screen to enter the base URL of the Compass server and the database.

In the iOS Settings for Compass, allow banners, sounds, and badges notifications, and enable Background Refresh. The logged in user will receive notifications when a new defect has been assigned to the user or when any modifications are made to a defect that the user currently owns.

## Development

### Login Scene

![Login Scene](statics/login_scene.png) ![Settings](statics/settings.png)

#### Overview

The Login Scene displays a username textbox, a password textbox, a repo button, and a settings icon. When the user selects the repo button, display the list of repos to choose. When the user selects the settings icon, display textboxes for the base URL of the Compass server and the database. Once the username, password, repo, database, and the base URL of the Compass server are provided by the user, login the user by invoking a Compass REST API.

#### Login Scene Diagram

<pre>
<a href='#getrepos-api'>getRepos API</a> -> <a href='#login-api'>login API</a>
</pre>

#### API Details

##### login API

1. Call the function `login(_ usernameText: String, _ passwordText: String)` using the username and password that the user provided.

2. Make the function `login(_ usernameText: String, _ passwordText: String)` call the `login(with username: String, password: String, repo: String, db: String, completion: @escaping(Result<Data?, ApiError>) -> Void)` function in the class `TRXNetworkManager` using the username, password, repo, and database that the user provided. This will get the HTTP Method (POST) and the URL request required to execute the API call.

3. Invoke the Compass login REST API call.

	* If the Compass login REST API call is successfully made, decode the data to the struct `AuthToken`.

		1. Store the token in the class `KeychainHelper` to make the token accessible for other Compass REST API calls.

	* If the Compass login REST API call fails, present an alert with the error message.

### Repo Selection Scene

![Repo Selection Scene](statics/repo_selection_scene.png)

#### Overview

The Repo Selection Scene displays a list of repos. The list of repos is obtained from the result of invoking a Compass REST API. The user can choose any repo from the list.

#### API Details

##### getRepos API

1. When the view controller `RepoSelectionVC` is loaded, call the function `fetchRepos()`.

2. Make the function `fetchRepos()` call the `getRepos(completion: @escaping(Result<Data?, ApiError>) -> Void)` function in the class `TRXNetworkManager`. This will get the HTTP Method (GET) and the URL request required to execute the API call.

3. Invoke the Compass getRepos REST API call.

	* If the Compass getRepos REST API call is successfully made, decode the data to an array of Repo structs `[Repo]`.

		1. In the function `tableView(_ tableView: UITableView, cellForRowAt indexPath: IndexPath) -> UITableViewCell`, configure each cell in the table using the repos inside the array of Repo structs `[Repo]`.

	* If the Compass getRepos REST API call fails, print the error status to the console.

### Record List Scene

![Assigned To Me](statics/record_list_scene.png) ![Reported By Me](statics/record_list_scene2.png)

#### Overview

The Record List Scene displays a list of records, either a list of records assigned to the logged in user or a list of records reported by the logged in user. The list of records is obtained by the results of invoking Compass query REST APIs.

First, determine whether the query already exists under the Personal Folder in Compass for the logged in user. If the query doesn't already  exist, create the query, create the result set of the query, and get the result set of the query.

If the query already exists, it is not necessary to create the query again. Instead, create the result set of the existing query and then get the result set of the query.

Give the user the option to logout.

#### Record List Scene Diagram

<pre>
<a href='#getfolders-api'>getFolders API</a>
  |
  Query not exists -> <a href='#createquery-api'>createQuery API</a> -> <a href='#createresultset-api'>createResultSet API</a> -> <a href='#getresultset-api'>getResultSet API</a>
  |
  Query exists -> <a href='#createresultset-api'>createResultSet API</a> -> <a href='#getresultset-api'>getResultSet API</a>
</pre>

#### API Details

##### getFolders API
1. Whenever the view controller `RecordListVC` is loaded or refreshed, call the function `getFolders()`.

2. Make the function `getFolders()` call the `getFolders(completion: @escaping(Result<Data?, ApiError>) -> Void)` function in the class `TRXNetworkManager`. This will get the token, repo, the HTTP Method (GET), and the URL request required to execute the API call.

3. Invoke the Compass getFolders REST API call.

	* If the Compass getFolders REST API call is successfully made, decode the data to an array of Folder structs `[Folder]`.

		* If the query doesn't already exist under the Personal Folder in Compass for the logged in user, see the `Query not exists` branch in the [Diagram](#record-list-scene-diagram).

		* If the query already exists under the Personal Folder in Compass for the logged in user, see the `Query exists` branch in the [Diagram](#diagram). 	
	* If the Compass getFolders REST API call fails, print the error status to the console.

##### createQuery API

1. Call the function `createQuery(in parentFolderDbId: String, with name: String)` using the dbId of the personal folder and the name of the query.

2. Make the function `createQuery(in parentFolderDbId: String, with name: String)` call the `createQuery(in parentFolderDbId: String, named name: String, completion: @escaping(Result<Data?, ApiError>) -> Void)` function in the class `TRXNetworkManager`. This will get the token, repo, URL request, the HTTP Method (POST), and the request body required to execute the API call. For the request body, use the name of the query to obtain the the query definition from the .json file. The .json file has the same name as the query.

3. Invoke the Compass createQuery REST API call.

	* If the Compass createQuery REST API call is successfully made, decode the data to the struct `QueryDef`.

		1. See [createResultSet API](#createresultset-api) to create the result set of the query.

	* If the Compass createQuery REST API call fails, print the error status to the console.

##### createResultSet API

1. Call the `createResultSet(for queryDbId: String)` function using the dbId of the query.

2. Make the function `createResultSet(for queryDbId: String)` call the `createResultSet(for queryDbId: String, completion: @escaping(Result<Data?, ApiError>) -> Void)` function in the class `TRXNetworkManager`. This will get the token, repo, URL request, the HTTP Method (POST), and the request body required to execute the API call. The request body contains `["pageSize": "999"]`.

3. Invoke the Compass createResultSet REST API call.

	* If the Compass createResultSet REST API call is successfully made, the decode the data to the struct `ResultSet`.

		1. See [getResultSet API](#getresultset-api) to get the result set of the query.

	* If the Compass createResultSet REST API call fails, print the error status to the console.

##### getResultSet API

1. Call the `getResultSet(of resultSetId: String, for queryDbId: String)` function using the Id of the result set and the dbId of the query.

2. Make the function `getResultSet(of resultSetId: String, for queryDbId: String)` call the `getResultSet(of resultSetId: String, for queryDbId: String, completion: @escaping(Result<Data?, ApiError>) -> Void)` function in the class `TRXNetworkManager`. This will get the token, repo, the HTTP Method (GET), and the URL request required to execute the API call.

3. Invoke the Compass getResultSet REST API call.

	* If the Compass getResultSet REST API call is successfully made, decode the data to the struct `ResultSetPage`.

		1. In the function `tableView(_ tableView: UITableView, cellForRowAt indexPath: IndexPath) -> UITableViewCell`, configure each cell in the table as a `RecordListCell` using the defects inside the array of ResultSetRow structs `[ResultSetRow]`.

	* If the Compass getResultSet REST API call fails, print the error status to the console.

##### logout API

1. Call the function `logout()`.

2. Make the function `logout()` call the `logoff(completion: @escaping(Result<Data?, ApiError>) -> Void)` function in the class `TRXNetworkManager`. This will get the token, the HTTP Method (POST), and the URL request required to execute the API call.

3. Invoke the Compass logout REST API call.

	* If the Compass logout REST API call is successfully made, dismiss the view controller to return to the [Login Scene](#login-scene).

		1. Remove the token from the class `KeychainHelper`.

	* If the Compass logout REST API call fails, print the error status to the console.

### Record Detail Scene

![Record Detail Scene](statics/record_detail_scene.png) ![Record Detail Actions](statics/record_detail_actions.png)

#### Overview

The Record Detail Scene displays a list of fields of a record. The list of record fields is obtained by the results of invoking Compass record REST APIs. There are three possible actions a user can take: modify, change state, or delete the record.

If the modify action is selected, make the record enter interactive editing mode and allow the user to modify the editable fields of the record. When the user edits a field, except for the `Headline` and `Description` fields, display a list of possible field values to choose. Once the editing is completed, save the updated fields of the record.

If the change state action is selected, display a list of possible states the record can change to. Once the user selects a state, the process is the same as when the modify action is selected.

If the delete action is selected, delete the record.

#### Record Detail Scene Diagram

<pre>
<a href='#getrecord-api'>getRecord API</a>
  |
  Modify -> <a href='#modifyrecord-api'>modifyRecord API (edit)</a> -> <a href='#getfield-api'>getField API</a> -> <a href='#modifyrecord-api'>modifyRecord API (save)</a>
  |
  Change state -> <a href='#getrecordtype-api'>getRecordType API</a> -> <a href='#modifyrecord-api'>modifyRecord API (edit)</a> -> <a href='#getfield-api'>getField API</a> -> <a href='#modifyrecord-api'>modifyRecord API (save)</a>
  |
  Delete -> <a href='#deleterecord-api'>deleteRecord API</a>
</pre>

#### API Details

##### getRecord API

1. When the view controller `RecordDetailVC` is loaded, call the function `getRecord(_ recordId: String)` using the record Id of the selected record from the table.

2. Make the function `getRecord(_ recordId: String)` call the `getRecord(with recordId: String, completion: @escaping(Result<Data?, ApiError>) -> Void)` function in the class `TRXNetworkManager`. This will get the token, repo, the HTTP Method (GET), and the URL request required to execute the API call.

3. Invoke the Compass getRecord REST API call.

	* If the Compass getRecord REST API call is successfully made, decode the data to the struct `Record`.

		1. In the function `tableView(_ tableView: UITableView, cellForRowAt indexPath: IndexPath) -> UITableViewCell`, configure each cell in the table as a `RecordFieldCell` using the fields inside the array of Field structs `[Field]`.

	* If the Compass getRecord REST API call fails, print the error status to the console.

##### modifyRecord API

1.  Call the function `modifyRecord(_ recordId: String, _ operation: String, body: [String: [[String: String?]]], actionName: String?)` using the record Id, the operation, the request body, and the action name. The modifyRecord API can be used to fulfill two operations:

	* Edit: Set the opertion parameter to `Edit` and the request body as `[:]`.

	* Save: Set the opertion parameter to `Commit` and the request body will be filled once the user presses the `Done` button.

2. Make the function `modifyRecord(_ recordId: String, _ operation: String, body: [String: [[String: String?]]], actionName: String?)` call the `modifyRecord(with recordId: String, body: [String: [[String: String?]]], operation: String, actionName: String?, completion: @escaping(Result<Data?, ApiError>) -> Void)` function in the class `TRXNetworkManager`. This will get the token, repo, the HTTP Method (PATCH), and the URL request required to execute the API call.

3. Invoke the Compass modifyRecord REST API call.

	* If the Compass modifyRecord REST API call is successfully made, decode the data to the struct `Record`.

		* If the `Commit` operation was used to invoke the Compass modifyRecord REST API call, see [getRecord API](#getrecord-api) to display the updated fields in the record.

	* If the Compass modifyRecord REST API call fails, print the error status to the console.

##### deleteRecord API

1. Call the function `deleteRecord(_ recordId: String)` using the record Id of the record.

2. Make the function `deleteRecord(_ recordId: String)` call the `deleteRecord(with recordId: String, completion: @escaping(Result<Data?, ApiError>) -> Void)` function in the class `TRXNetworkManager`. This will get the token, repo, the HTTP Method (DELETE), and the URL request required to execute the API call.

3. Invoke the Compass deleteRecord REST API call.

	* If the Compass deleteRecord REST API call is successfully made, reload the data in the [Record List Scene](#record-list-scene).

	* If the Compass deleteRecord REST API call fails, print the error status to the console.

### State Selection Scene

![State Selection Scene](statics/state_selection_scene.png)

#### Overview

The State Selection Scene displays a list of possible states that the record can change to. The list of states is obtained from the result of invoking a Compass record REST API. The user can choose any state from the list.

#### API Details

##### getRecordType API

1. When the view controller `StateSelectionVC` is loaded, call the function `getRecordType()`.

2. Make the function `getRecordType()` call the `getRecordType(completion: @escaping(Result<Data?, ApiError>) -> Void)` function in the class `TRXNetworkManager`. This will get the token, repo, the HTTP Method (GET), and the URL request required to execute the API call.

3. Invoke the Compass getRecordType REST API call.

	* If the Compass getRecordType REST API call is successfully made, decode the data to the struct `RecordType`.

		1. In the function `tableView(_ tableView: UITableView, cellForRowAt indexPath: IndexPath) -> UITableViewCell`, configure each cell in the table using the possible states inside the array of State structs `[State]`.

	* If the Compass getRecordType REST API call fails, print the error status to the console.

### Field Selection Scene

![Field Selection Scene](statics/field_selection_scene.png)

#### Overview

The Field Selection Scene displays a list of field values for a specific field of a record. The list of field values is obtained from the result of invoking a Compass REST API. The user can choose any field value from the list.

#### API Details

##### getField API

1. When the view controller `FieldSelectionVC` is loaded, call the function `getField(_ recordId: String, _ fieldName: String)` using the record Id of the record and the name of the selected field.

2. Make the function `getField(_ recordId: String, _ fieldName: String)` call the `getField(of recordId: String, with fieldName: String, completion: @escaping(Result<Data?, ApiError>) -> Void)` function in the class `TRXNetworkManager`. This will get the token, repo, the HTTP Method (GET), and the URL request required to execute the API call.

3. Invoke the Compass getField REST API call.

	* If the Compass getField REST API call is successfully made, decode the data to the struct `Field`.

		1. In the function `tableView(_ tableView: UITableView, cellForRowAt indexPath: IndexPath) -> UITableViewCell`, configure each cell in the table using the field values inside the `fieldChoiceList` array.

	* If the Compass getField REST API call fails, print the error status to the console.

### Create Record Scene

![Create Record Scene](statics/create_record_scene.png)

#### Overview

The Create Record Scene displays a list of empty fields of a newly created record. The list of record fields is obtained by the results of invoking a Compass REST API. When the record is created, make the record enter interactive editing mode and allow the user to modify the editable fields of the record. When the user edits a field, except for the `Headline` and `Description` fields, display a list of possible field values to choose. Once the editing is completed, save the updated fields of the record.

#### Create Record Scene Diagram

<pre>
<a href='#createrecord-api'>createRecord API</a> -> <a href='#getfield-api'>getField API</a> -> <a href='#modifyrecord-api'>modifyRecord API (save)</a>
</pre>

#### API Details

##### createRecord API

1. When the view controller `CreateRecordVC` is loaded, call the function `createRecord()`.

2. Make the function `createRecord()` call the `createRecord(completion: @escaping(Result<Data?, ApiError>) -> Void)` function in the class `TRXNetworkManager`. This will get the token, repo, the HTTP Method (POST), the `Edit` operation, the empty request body, and the URL request required to execute the API call.

3. Invoke the Compass createRecord REST API call.

	* If the Compass createRecord REST API call is successfully made, decode the data to the struct `Record`.

		1. In the function `tableView(_ tableView: UITableView, cellForRowAt indexPath: IndexPath) -> UITableViewCell`, configure each cell in the table as a `RecordFieldCell` using the fields inside the array of Field structs `[Field]`.

	* If the Compass createRecord REST API call fails, print the error status to the console.

### Notifications

#### Overview

Every five minutes, including when the app is in the background, check whether there are any new defects assigned to the logged in user or if any modifications have been made to a defect that the user currently owns. This is done using Compass query REST APIs that are also implemented for the [Record List Scene](#record-list-scene).

#### Notifications Diagram

<pre>
<a href='#getfolders-api'>getFolders API</a> -> <a href='#createquery-api'>createQuery API</a> -> <a href='#createresultset-api'>createResultSet API</a> -> <a href='#getresultset-api'>getResultSet API</a> -> <a href='#deletequery-api'>deleteQuery API</a>
</pre>

#### API Details

In the [createQuery API](#createquery-api), create the query using the query name `Modified Defect`. In the function `createQueryNotifications(in parentFolderDbId: String, named name: String, timeString: String, completion: @escaping(Result<Data?, ApiError>) -> Void)` in the class `TRXNetworkManager`, set the `history.action_timestamp` field filter in the query to the timestamp of the last time the createQuery API was invoked.

In the [getResultSet API](#getresultset-api), if there is at least one record in the result set of the query, trigger a notification for each record.
