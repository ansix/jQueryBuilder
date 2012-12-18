(function( $ ){

	var Comparators = { "comparators" : {
		"Number" : 
			[{"Comparator": "ist",
				"ArgumentCount" : 1,
				"ArgumentDefaults" : [] },
			 {"Comparator" : "ist nicht",
				"ArgumentCount" : 1,
				"ArgumentDefaults" : [] },
			 {"Comparator" : "groesser als",
				"ArgumentCount" : 1,
					"ArgumentDefaults" : [] },
			 {"Comparator" : "kleiner als",
				"ArgumentCount" : 1,
				"ArgumentDefaults" : [] },
			 {"Comparator" : "zwischen",
				"ArgumentCount" : 2,
				"ArgumentDefaults" : [] }
			 ],
			
		"Date" : 
			[{"Comparator": "ist",
				"ArgumentCount" : 1,
				"ArgumentDefaults" : [] },
			 {"Comparator" : "ist nicht",
				"ArgumentCount" : 1,
				"ArgumentDefaults" : [] },
			 {"Comparator" : "bevor",
				"ArgumentCount" : 1,
				"ArgumentDefaults" : [] },
			 {"Comparator" : "danach",
				"ArgumentCount" : 1,
				"ArgumentDefaults" : [] },
				{"Comparator" : "zwischen",
				"ArgumentCount" : 2,
				"ArgumentDefaults" : [] }
			],
			
		"String" : 
			[{"Comparator": "ist",
				"ArgumentCount" : 1,
				"ArgumentDefaults" : [] },
			 {"Comparator" : "ist nicht",
				"ArgumentCount" : 1,
				"ArgumentDefaults" : [] },
			 {"Comparator" : "beinhaltet",
				"ArgumentCount" : 1,
				"ArgumentDefaults" : [] },
			 {"Comparator" : "beinhaltet nicht",
				"ArgumentCount" : 1,
				"ArgumentDefaults" : [] },
			 {"Comparator" : "beginnt mit",
				"ArgumentCount" : 1,
				"ArgumentDefaults" : [] },
			 {"Comparator" : "endet mit",
				"ArgumentCount" : 1,
				"ArgumentDefaults" : [] }
			]
	},
	
	"mysqlComparators"  :{
		"ist" : "=",
		"ist nicht" : "!=",
		"groesser als" : ">",
		"kleiner als" : "<",
		"zwischen" : "BETWEEN",
		"bevor" : "<",
		"danach" : ">",
		"beinhaltet" : "%",
		"beinhaltet nicht" : "!",
		"beginnt mit" : "%",
		"endet mit" : "%",
	}};



	var methods = {
		init:	function (options) {
			$.fn.queryBuilder.options = $.extend({fields : [], existing_clauses: []},options);
			$.fn.queryBuilder.options = $.extend($.fn.queryBuilder.options, Comparators);
			$.fn.queryBuilder.options = $.extend($.fn.queryBuilder.options, {'bindTo' : options.bindTo ? options.bindTo : '#clauses'});
			
			
			var fields 				= options.fields,
				existing_clauses 	= options.existing_clauses,
				comparators 		= $.fn.queryBuilder.options.comparators,
				mysqlComparators 	= $.fn.queryBuilder.options.mysqlComparators,
				bindTo				= options.bindTo ? options.bindTo : '#clauses',
				template;

			//setup
			methods.setup(fields, existing_clauses);
		},
		
		setup: function(fields, existing_clauses){
		
			// create a template that looks like:
			// <div class="clause">
			// 	<select class="fields">
			// 		<option data-fieldtype="FieldType1">FieldName1</option>
			// 		<option data-fieldtype="FieldType2">FieldName2</option>
			// 	</select>
			//  <select class="comparators"></select>
			// 	<span class="conditions"></span>
			// 	<button class="remove-clause">remove</button>
			//	<select class="combiner"></select>
			// </div>
			template = $("<div/>", { class: "clause" } );
			var fields_dropdown = $("<select/>", { class: "fields"});
			for(var i in fields)
			{
				$("<option/>")
					.attr("data-fieldtype", fields[i].FieldType)
					.val(fields[i].FieldName)
					.text(fields[i].FieldTitle)
					.appendTo(fields_dropdown);
			}
			fields_dropdown.change(function(){
				methods.adjustField($(this).parent(), $(this).find('option:selected').attr('data-fieldtype'));
			});
			fields_dropdown.appendTo(template);
			
			var comparators_dropdown = $("<select/>", { class: "comparators"})
			comparators_dropdown.change(function(){
				methods.adjustComparator($(this).parent(), $(this).val());
			});
			comparators_dropdown.appendTo(template);
			
			
			$("<span/>", { class: "conditions"})
				.appendTo(template);
			$("<button class='rm'/>")
				.text("X")
				.click(function(){
					
					// SET ARRAY
					if($(this).parent().index() != -1){
						existing_clauses.splice($(this).parent().index(),1);
					}
					$(this).parent().remove();
					
				})
				.appendTo(template);
				
			// LIFE
			var combiner_dropdown = $("<select/>", { class: "combiner"});
			combiner_dropdown.change(function(){
				adjustCombiner($(this).parent(), $(this).val());
				});
				$("<option/>")
					.text('and')
					.appendTo(combiner_dropdown);
				$("<option/>")
					.text('or')
					.appendTo(combiner_dropdown);
			
			combiner_dropdown.appendTo(template);
			// LIFE
		
			methods.adjustField(template, fields[0].FieldType);
			
			if(existing_clauses.size == 0){
				template.clone(true).appendTo(this);
			}
			
			//add Template to options
			$.fn.queryBuilder.options = $.extend($.fn.queryBuilder.options, {'template': template});
						
			// hydrate the existing clauses
			for(var i in existing_clauses)
			{
				methods.addClause(existing_clauses[i]);
			}
		},
		// change the condition UI to fit the selected field
		// expects: clause: a jquery object representing a clause div
		// 					fieldtype: a type of field.. surprise!
		adjustField: function(clause, fieldtype){
			// clear the options from the .comparators select
			var dropdown = $(clause).find(".comparators");
			dropdown.find("option").remove();
		
			// SET ARRAY
			if(clause.index() != -1){
				$.fn.queryBuilder.options.existing_clauses[clause.index()].FieldName = $(clause).find(".fields").val();
			}
		
			// fill in the new options
			for (var i in $.fn.queryBuilder.options.comparators[fieldtype])
			{
				$("<option/>")
					.text($.fn.queryBuilder.options.comparators[fieldtype][i].Comparator)
					.appendTo(dropdown);
			}
			methods.adjustComparator(clause,$.fn.queryBuilder.options.comparators[fieldtype][0]);
		},
		// change the parameters UI to fit the condition specified
		// expects: clause: a jquery object representint a clause div
		// 					comparator: a comparator (string OR object) eg. "is", "greater than" etc
		adjustComparator : function(clause, comparator){
			// clear the previous conditions
			var conditions = clause.find(".conditions");
			conditions.find("*").remove();
			
			// SET ARRAY
			if(clause.index() != -1){
				$.fn.queryBuilder.options.existing_clauses[clause.index()].Condition.Comparator = comparator.Comparator ? comparator.Comparator : comparator;
				$.each($.fn.queryBuilder.options.existing_clauses[clause.index()].Condition.Arguments, function(idx, val){
					$.fn.queryBuilder.options.existing_clauses[clause.index()].Condition.Arguments[idx] = '';
				});
			}
			var fieldtype = clause.find(".fields option:selected").attr('data-fieldtype');
			
			// form the comparator object out of a string
			if(typeof(comparator) == 'string'){		
				for (var i in $.fn.queryBuilder.options.comparators[fieldtype]){
					if ($.fn.queryBuilder.options.comparators[fieldtype][i].Comparator == comparator){
						comparator = $.fn.queryBuilder.options.comparators[fieldtype][i];
					}
				}
			}
			

			
			switch(comparator.ArgumentCount)
			{
				case 1:
					// add textbox to .conditions <span>
					var input = $("<input/>")
						.val(comparator.ArgumentDefaults[0])
						.attr("type","text")
						.appendTo(conditions)
						.focusout(function(){ setValueOfInput(clause, $(this).parent().find('input').val().replace(/([^a-z0-9\ä\ö\ü\ß]\-)+/i, '')); });
					if(fieldtype === "Date"){
						input.datepicker({"dateFormat" : 'yy-mm-dd'});
					}
					if(fieldtype === "Number"){
						input.keydown(function(event) {
							// Allow: backspace, delete, tab, escape, and enter
							if ( event.keyCode == 46 || event.keyCode == 8 || event.keyCode == 9 || event.keyCode == 27 || event.keyCode == 13 || 
								 // Allow: Ctrl+A
								(event.keyCode == 65 && event.ctrlKey === true) || 
								 // Allow: home, end, left, right
								(event.keyCode >= 35 && event.keyCode <= 39)) {
									 // let it happen, don't do anything
									 return;
							}
							else {
								// Ensure that it is a number and stop the keypress
								if (event.shiftKey || (event.keyCode < 48 || event.keyCode > 57) && (event.keyCode < 96 || event.keyCode > 105 )) {
									event.preventDefault(); 
								}   
							}
						});
					}
					break;
				case 2:
					// add a textbox, then a span, then another textbox 
					var input1 = $("<input/>")
						.val(comparator.ArgumentDefaults[0])
						.attr("type","text")
						.appendTo(conditions).focusout(function(){ setValueOfInputs(clause, $(this).val(), $(this).parent().find('input').last().val()); });
					$("<span/>")
						.text("und")
						.appendTo(conditions);
					var input2 = $("<input/>")
						.val(comparator.ArgumentDefaults[0])
						.attr("type","text")
						.appendTo(conditions).focusout(function(){ setValueOfInputs(clause, $(this).val(), $(this).parent().find('input').first().val()); });
					
					if(fieldtype === "Date"){
						input1.datepicker({"dateFormat" : 'yy-mm-dd'});
						input2.datepicker({"dateFormat" : 'yy-mm-dd'});
					}
					if(fieldtype === "Number"){
						input1.keydown(function(event) {
							// Allow: backspace, delete, tab, escape, and enter
							if ( event.keyCode == 46 || event.keyCode == 8 || event.keyCode == 9 || event.keyCode == 27 || event.keyCode == 13 || 
								 // Allow: Ctrl+A
								(event.keyCode == 65 && event.ctrlKey === true) || 
								 // Allow: home, end, left, right
								(event.keyCode >= 35 && event.keyCode <= 39)) {
									 // let it happen, don't do anything
									 return;
							}
							else {
								// Ensure that it is a number and stop the keypress
								if (event.shiftKey || (event.keyCode < 48 || event.keyCode > 57) && (event.keyCode < 96 || event.keyCode > 105 )) {
									event.preventDefault(); 
								}   
							}
						});
						input2.keydown(function(event) {
							// Allow: backspace, delete, tab, escape, and enter
							if ( event.keyCode == 46 || event.keyCode == 8 || event.keyCode == 9 || event.keyCode == 27 || event.keyCode == 13 || 
								 // Allow: Ctrl+A
								(event.keyCode == 65 && event.ctrlKey === true) || 
								 // Allow: home, end, left, right
								(event.keyCode >= 35 && event.keyCode <= 39)) {
									 // let it happen, don't do anything
									 return;
							}
							else {
								// Ensure that it is a number and stop the keypress
								if (event.shiftKey || (event.keyCode < 48 || event.keyCode > 57) && (event.keyCode < 96 || event.keyCode > 105 )) {
									event.preventDefault(); 
								}   
							}
						});
					}
					
					
					break;
			}
			
			function setValueOfInput(clause, value){
				// SET ARRAY
				if(clause.index() != -1){
					$.fn.queryBuilder.options.existing_clauses[clause.index()].Condition.Arguments[0] = value;
				}
			}
			
			function setValueOfInputs(clause, val1, val2){
				// SET ARRAY
				if(clause.index() != -1){
					$.fn.queryBuilder.options.existing_clauses[clause.index()].Condition.Arguments[0] = val1;
					$.fn.queryBuilder.options.existing_clauses[clause.index()].Condition.Arguments[1] = val2;
				}
			}
		},
		addClause:  function(clause) { 
			var template = $.fn.queryBuilder.options.template;
			
			var new_clause = template.clone(true);
				
			if(clause){
					
				// Expects a clause that looks like:
				// {
				// 	"FieldName" : "Title",
				// 	"Condition" : {
				// 		"Comparator" : "is",
				// 		"Arguments" : ["1984"]
				// 	}
				// },
		
				// set the field
				new_clause.find('.fields').val(clause.FieldName);
				methods.adjustField(new_clause, $('.fields option:selected', new_clause).attr('data-fieldtype'));
				
				// set the comparator
				new_clause.find('.comparators').val(clause.Condition.Comparator);
				methods.adjustComparator(new_clause, clause.Condition.Comparator);
				
				// set the combiner
				if(clause.Combiner != ''){
					new_clause.find('.combiner').val(clause.Combiner);
				}else{
					//new_clause.find('.combiner').remove();
				}
				
				// fill in the arguments
				var inputs = new_clause.find('.conditions input');
				if(clause.Condition.Arguments.length == 1){
					inputs.val(clause.Condition.Arguments[0]);
				} else {
					for (var i in clause.Condition.Arguments){
						inputs[i].value = clause.Condition.Arguments[i];
					}			
					
				}
			} else {
				 $.fn.queryBuilder.options.existing_clauses.push({
						"FieldName" : $.fn.queryBuilder.options.fields[0].FieldName,
						"Condition" : {
							"Comparator" : "ist",
							"Arguments" : ['']
						},
						"Combiner" : "and"
						
					});
					methods.adjustComparator(new_clause, "ist");
			}
			
			
			
			new_clause.appendTo($.fn.queryBuilder.options.bindTo);
		},
		// Output where Clause
		getWhereClause: function(){
			var clause = '',
				mysqlComparators =  $.fn.queryBuilder.options.mysqlComparators;
			$.each($.fn.queryBuilder.options.existing_clauses, function(id, val){
				var type = $.grep($.fn.queryBuilder.options.fields, function(e){ return e.FieldName == val.FieldName; })[0].FieldType;
				var ticks = '';
				if(type === 'Date' || type == 'String') ticks = '\'';
		
				switch(val.Condition.Comparator){
					case 'zwischen': 
						clause += val.FieldName + ' ' + mysqlComparators[val.Condition.Comparator] + ' ' + ticks + val.Condition.Arguments[0] + ticks + ' AND ' + ticks + val.Condition.Arguments[1] + ticks + ' ' + val.Combiner + ' ';
		
						break;
					case 'beinhaltet':
						clause += val.FieldName + ' like \'%' + val.Condition.Arguments[0] + '%\' ' + val.Combiner + ' ';
						break;	
					case 'beinhaltet nicht':
						clause += val.FieldName + ' not like \'%' + val.Condition.Arguments[0] + '%\' ' + val.Combiner + ' ';
						break;		
					case 'beginnt mit':
						clause += val.FieldName + ' like \'' + val.Condition.Arguments[0] + '%\' ' + val.Combiner + ' ';
						break;
					case 'endet mit':
						clause += val.FieldName + ' like \'%' + val.Condition.Arguments[0] + '\' ' + val.Combiner + ' ';
						break;
					default:
						clause += val.FieldName + ' ' + mysqlComparators[val.Condition.Comparator] + ' ' + ticks + val.Condition.Arguments[0] + ticks + ' ' + val.Combiner + ' ';
						
						break;
				}
			});
			
			return clause.replace(/(and | or )$/, "");
		},
		getFilterAsObject: function(asString){
			if(asString){
				return obj2json($.fn.queryBuilder.options.existing_clauses);
			}
			else
				return $.fn.queryBuilder.options.existing_clauses;
		},
		changeData: function(data){
		
			$('.rm').trigger('click');
		
			$.fn.queryBuilder.options.existing_clauses = data.newClauses;
			$.fn.queryBuilder.options.fields = data.newFields;
			methods.setup($.fn.queryBuilder.options.fields, $.fn.queryBuilder.options.existing_clauses);
		}
	};

	$.fn.queryBuilder = function ( method ){
		// Method calling logic
    	if ( methods[method] ) {
      		return methods[ method ].apply( this, Array.prototype.slice.call( arguments, 1 ));
    	} else if ( typeof method === 'object' || ! method ) {
      		return methods.init.apply( this, arguments );
    	} else {
      		$.error( 'Method ' +  method + ' does not exist on jQuery.queryBuilder' );
    	}  
	};
	

	

})( jQuery );


function obj2json(_data){
    str = (($.type(_data)== 'array')?'[ ': '{ ');
    first = true;
    $.each(_data, function(i, v) { 
        if(first != true)
            str += ",";
        else first = false;
        if ($.type(v)== 'object' ){
        	if(typeof(i)=='number'){
            	str += obj2json(v) ;
            } else {
            	str += '"' + i + '":' + obj2json(v) ;
            }
        }
        else if ($.type(v)== 'array')
            str += '"' + i + '":' + obj2json(v) ;
        else{
            if($.type(_data)== 'array')
                str += '"' + v + '"';
            else
                str +=  '"' + i + '":"' + v + '"';
        }
    });
    return str+= (($.type(_data)== 'array')? ' ] ':' } ');;
}
