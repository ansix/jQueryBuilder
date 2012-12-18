jQueryBuilder
=============

This is a Plugin for jQuery based on the code from kevindavis https://github.com/kevindavis/filterbuilder.
It builds SQL where clauses on the given Input. 

*I implemented just a german translation.


##USAGE

*define your table Fields

var my_fields = [
	{
		"FieldName": "Title",
		"FieldTitle": "Readable Title"
		"FieldType": "String"
	}
	...
]

Possible FieldTypes are String, Number or Date.


*define your Clauses

var my_clauses = [
	{
		"FieldName" : "Title",
		"Condition" : {
			"Comparator" : "ist",
				"Arguments" : ['1984']
			},
		"Combiner" : "and"	
	},
	{
		"FieldName" : "PageCount",
			"Condition" : {
				"Comparator" : "zwischen",
				"Arguments" : ['100','200']
			},
		"Combiner" : "or"
	}
]

*Plugin init

$('#placeholder').queryBuilder({
		fields: my_fields, 
		existing_clauses: my_existing_clauses
	});

*Get WHERE Clause

var where = $('#placeholder').queryBuilder('getWhereClause');

*Get Actual Filter as String (used for storing it to DB or something else)

var filter = $('#filtertest #clauses').queryBuilder('getFilterAsObject',{string: true});

If you use {sting: true} the clauses will be parsed as String. If not you get the full JSON Object.

##TODO
- testing
- internationalization
- ...


