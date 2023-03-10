 export default {
	"swagger": "2.0",
	"info": {
	  "description": "There is Polkadot.js RPC API to HTTP API project api doc.",
	  "version": "1.0.0",
	  "title": "Polkadot.js HTT API"
	},
	"host": "localhost:8080",
	"basePath": "/api/call/",
	"schemes": [	  
	  "http"
	],
	"tags": [{name:'hello'}],
	"paths":"{path}",
	"securityDefinitions": {
	  "petstore_auth": {
		"type": "oauth2",
		"authorizationUrl": "http://petstore.swagger.io/oauth/dialog",
		"flow": "implicit",
		"scopes": {
		  "write:pets": "modify pets in your account",
		  "read:pets": "read your pets"
		}
	  },
	  "api_key": {
		"type": "apiKey",
		"name": "api_key",
		"in": "header"
	  }
	},
	"definitions": {
	  "ApiResponse": {
		"type": "object",
		"properties": {
		  "code": {
			"type": "integer",
			"format": "int32"
		  },
		  "type": {
			"type": "string"
		  },
		  "message": {
			"type": "string"
		  }
		}
	  }
	} 
  }