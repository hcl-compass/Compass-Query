# CompassQuery
This repository contains the files necessary to create a Node-RED flow that will extract data from Compass for use in 3rd party software.

## Who is this tutorial for?

This overview is intended for Compass Administrators who will assist their organization in providing easy access to Compass data for use in 3rd party software products.

## Usage

Following these directions will result . . . . .

## Getting Started

These instructions will get you a copy of the Xcode project on your Mac for development and testing purposes.

### Prerequisites

Xcode needs to be downloaded from the App Store. It is recommended to use Xcode 11 or later, and macOS 10.14.4 or later.
Compass needs to be installed and the Compass server needs to be running somewhere.


## Build the App

To build the app in Xcode, click on Product in the menu bar and then click on Clean Build Folder.
To run the app in Xcode, click on Product in the menu bar and then click on Run.
To build and then run the app, click on the play icon in the top left corner.

## License

/*
 
 Copyright 2021 HCL Technologies Ltd.

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

