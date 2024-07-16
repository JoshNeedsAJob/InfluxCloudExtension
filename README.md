# influxcloudextension README

This Influx cloud extension is intended to make executing SQL, InfluxQL and Flux queries against the cloud version of Influx easier. 

## Features

### Add/Remove servers: 

![manage servers](resources/readme/image2.png)

Click the server in the task bar (or choose the Influx: Select Influx Server command ) to open the menu allowing you to select a server or add a new server. 

### Execute queries with parameters: 

![parameters](resources/readme/image1.png)

To add parameters to a query add a line with the first two characters '#$'

The format for parameters is 

`#$parametername:parametertype=parmaetervalue`

The parameter type is optional.  Valid types are string, number and boolean. 

Flux scripts do not allow parameters. 

To execute a script hit F5 or execute the Influx: Execute Influx Query command.  

## Requirements

No additional requirements are identified. 

## Extension Settings

No extension settings are available. 

## Known Issues

This is my first time publishing an extension, so you can expect it to get better with future releases. 

## Release Notes

Users appreciate release notes as you update your extension.

### 1.0.0

Initial release.

## Following extension guidelines

Ensure that you've read through the extensions guidelines and follow the best practices for creating your extension.

* [Extension Guidelines](https://code.visualstudio.com/api/references/extension-guidelines)


