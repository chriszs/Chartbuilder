var COMMA = ',';
var TAB = String.fromCharCode(9);

var chart;

ChartBuilder = {
	allColors: ['db4730','e58d3c','f0c74f','04807e','4da9da',
				'6d2217','72461d','776326','04403e','26546d',
				'a43424','ab6a2d','b3943a','04605d','3a7ea3',
				'db4730','e58d3c','f0c74f','04807e','4da9da',
				'e47563','ebaa69','f3d576','4ca09e','7bbfe3',
				'eea397','f2c69b','f7e3a2','88c0bf','7bbfe3',
				'f6d1cb','f9e2cc','fbf1d0','c4dfdf','d2eaf6'],
	curRaw: '',
	paletteOpen: false,
	getNewData: function(csv) {
        var separator = COMMA;

        var comma_count = csv.split(COMMA).length - 1;
        var tab_count = csv.split(TAB).length - 1;

        if (tab_count >= comma_count) {
            separator = TAB;
        }

        var reader = new CSVKit.Reader({
            separator: separator,
            columns_from_header: false
        });

        reader.parse(csv);

		// If there aren't at least two columns, return null
		if(reader.rows[0].length < 2) {
            throw 'At least two columns are required.';
        }

		// If there aren't at least two non empty rows, return null
		if(reader.rows.length < 2) {
            throw 'At least two rows are required.';
		}

        // Too many columns?
        if (reader.rows[0].length > 10) {
            alert('Your data has more than 10 columns. This probably won\'t work well with this tool.');
        // Too many rows?
        } else if (reader.rows.length > 10) {
            alert('Your data has more than 10 rows. This probably won\'t work well with this tool.');
        }

        return reader.rows;
	},
	// Given the matrix containing the well formated csv, create the object that
	// is going to be used later
	makeDataObj: function(csv_matrix) {
		// Make the data array
		var data = [];
		for(var i=0; i<csv_matrix[0].length; i++) {
			// Object for a single column
			var obj = {
                name: csv_matrix[0][i],
                data: []
            };

			// Make the obj
			for(var j=1; j<csv_matrix.length; j++) {
				// If it is the first column, containing the names
				if(i == 0) {
					obj.data.push(csv_matrix[j][i]);
				}
				// If it's a data point
				else {
					var value = csv_matrix[j][i];
					if(value == 'null' || value == '') {
						//allow for nulls or blank cells
						value = null
					}
					else if (isNaN(value)){
						//data isn't valid
						return null;
					}
					else {
						value = parseFloat(value);
					}
					
					obj.data.push(value);
				}
			}

			data.push(obj);
		}

		return {data: data};
	},
	parseData: function(a) {
		var d = []
		var parseFunc;
		for (var i=0; i < a.length; i++) {
			if (i == 0) {
				parseFunc = this.doNothing
			}
			else {
				parseFunc = this.floatAll
			}
			
			d.push({
				'name': a[i].shift().split('..').join('\n'),
				'data':parseFunc(a[i]),
			});
			
		};
		for (var i = d.length - 1; i >= 0; i--){
			for (var j = d[i].length - 1; j >= 0; j--){
				if(d[i][j] == '' || d[i][j]==' ') {
					d[i][j] = null
				}
			};
		};
		return d
	},
	mergeData: function(a) {
		var d
		for (var i=0; i < a.data.length; i++) {
			d = a.data[i]
			if(i < chart.g.series.length) {
				a.data[i] = $.extend({},chart.g.series[i],d)
			}
			
		};
		
		return a
	},
	createTable: function(r){
		$table = $('#dataTable table')
		$table.text('')


		$table.append('<tr><th>'+r[0].join('</th><th>')+'</th></tr>')
		for (var i=1; i < r.length; i++) {
			if(r[i]) {
				//add commas to the numbers
				for (var j = 0; j < r[i].length; j++) {
					r[i][j] = this.addCommas(r[i][j])
				};

				$('<tr><td>'+r[i].join('</td><td>')+'</td></tr>')
					.appendTo($table)
			}				
		};
    },
    floatAll: function(a) {
		for (var i=0; i < a.length; i++) {
			if(a[i] && a[i].length > 0 && (/[\d\.]+/).test(a[i])) {
				a[i] = parseFloat(a[i])
			}
			else {
				a[i] = null
			}
		};
		return a
	},
	doNothing: function(a) {
		return a
	},
	inlineAllStyles: function() {
		var chartStyle, selector, cssText;
		
		for (var i = document.styleSheets.length - 1; i >= 0; i--){
			if(document.styleSheets[i].href && document.styleSheets[i].href.indexOf('gneisschart.css') != -1) {
				if (document.styleSheets[i].rules != undefined) {
					chartStyle = document.styleSheets[i].rules 
				}
				else {
					chartStyle = document.styleSheets[i].cssRules
				}
			}
		}
		if(chartStyle != null && chartStyle != undefined)
		{
			for (var i=0; i < chartStyle.length; i++) {
				if(chartStyle[i].type == 1) {
					//cssRule is a style rule
					selector = chartStyle[i].selectorText;
					cssText = chartStyle[i].style.cssText;
					d3.selectAll(selector).attr('style',cssText)
				}
			};
		}
	},
	createChartImage: function() {
		// Create PNG image
		var canvas = document.getElementById('canvas')
		canvas.width = $('#chartContainer').width() * 2
		canvas.height = $('#chartContainer').height() *2

		var canvasContext = canvas.getContext('2d')
		var svg = $.trim(document.getElementById('chartContainer').innerHTML)
		canvasContext.drawSvg(svg,0,0)
		
		
		var filename = [];
		
		if(chart.g.title.length > 0) {
			filename.unshift(chart.g.title)
		}
		
		filename = filename.join('-').replace(/[^\w\d]+/gi, '-');
		
		
		$('#downloadImageLink')
			.attr('href',canvas.toDataURL('png'))
			.attr('download', function() { 
				return filename + '_chartbuilder.png'
		    });

        // Create SVG image
		var svgString = $("#chartContainer").html()
		svgString = '<?xml version="1.0" encoding="utf-8"?>\n<!DOCTYPE svg PUBLIC "-//W3C//DTD SVG 1.1//EN" "http://www.w3.org/Graphics/SVG/1.1/DTD/svg11.dtd">\n<svg ' + svgString.split("<svg ")[1]

	    $("#downloadSVGLink")
            .attr("href", "data:text/svg," + encodeURI(svgString.split("PTSerif").join("PT Serif")) )
		    .attr("download", function() { return filename + "_chartbuilder.svg" })

		this.storeLocalChart(filename);	
        this.loadStoredCharts();
		
	},
	redraw: function() {
		$('.seriesItemGroup').detach()
		var g = chart.g, s, picker;
		this.customLegendLocaion = false;
		var seriesContainer = $('#seriesItems')
			
		for (var i=0; i < g.series.length; i++) {
			s = g.series[i]
			seriesItem = $('<div class="seriesItemGroup">\
				<label for="'+this.idSafe(s.name)+'_color">'+s.name+'</label>\
				<input id="'+this.idSafe(s.name)+'_color" name="'+this.idSafe(s.name)+'" type="text" />\
			</div>');
			
            var color = s.color ? s.color.replace('#','') : g.colors[i].replace('#','')
			
			seriesContainer.append(seriesItem);
			var picker = seriesItem.find('#'+this.idSafe(s.name)+'_color').colorPicker({pickerDefault: color, colors:this.allColors});

			seriesItem.data('index',i)
			picker.change(function() {
				chart.g.series[$(this).parent().data().index].color = $(this).val()
				ChartBuilder.redraw()
			})
			
			chart.redraw()
		}

        $('#typePicker').off('change').on('change', function() {
            var val = $(this).val();

            chart.g.type = val;

            // Regenerate axes from data or min/max
            chart.g.yAxis.domain = [null, null];
            $("#right_axis_max").keyup();
            $("#right_axis_min").keyup();

            ChartBuilder.redraw();
        });		
		
		chart.g = g;
		ChartBuilder.inlineAllStyles();
	},
	getAllInputData: function() {
		var d = {}, $el;
		var elems = $('input:not([id^=colorPicker]), textarea, select:not(#previous_charts)').each(function() {
			$el = $(this)
			d[$el.attr('id')] = $el.val()
		})
		return d
	},
	storeLocalChart: function(name) {
		try {
			localStorage['savedCharts'][0]
		}
		catch(e) {
			localStorage['savedCharts'] = JSON.stringify([])
		}
		
		var allcharts = JSON.parse(localStorage['savedCharts'])
		newChart = this.getAllInputData()
		newChart.name = name
        newChart.created = (new Date()).valueOf();
        
		allcharts.push(newChart)
		localStorage['savedCharts'] = JSON.stringify(allcharts);
	},
	getLocalCharts: function() {
		var charts = []
		try {
			charts = JSON.parse(localStorage['savedCharts'])
		}
		catch(e){ /* Fail Silently */}
		
		return charts
	},
	loadLocalChart: function(d) {
		for (var key in d) {
			if(key != 'name' && key != 'created') {
				$('#'+key).val(d[key])
			}
		}
		$('input:not([id^=colorPicker]), textarea, select:not(#previous_charts)').keyup().change();
	},
	idSafe: function(s) {
		s = s.replace(/[^\w\d]+/gi,'-')
		return s
	},
	addCommas: function(nStr)
	{
		nStr += '';
		x = nStr.split('.');
		x1 = x[0];
		x2 = x.length > 1 ? '.' + x[1] : '';
		var rgx = /(\d+)(\d{3})/;
		while (rgx.test(x1)) {
			x1 = x1.replace(rgx, '$1' + ',' + '$2'); //TODO localize this
		}
		return x1 + x2;
	},
	actions: {
		axis_prefix_change: function(index,that) {
			chart.g.yAxis.prefix = $(that).val()
			ChartBuilder.redraw()
			ChartBuilder.inlineAllStyles();
		},
		axis_suffix_change: function(index,that) {
			chart.g.yAxis.suffix = $(that).val()
			ChartBuilder.redraw()
			ChartBuilder.inlineAllStyles();
		},
		axis_tick_num_change: function(index,that) {
			chart.g.yAxis.ticks = parseInt($(that).val())
			ChartBuilder.redraw()
			ChartBuilder.inlineAllStyles();
		},
		axis_max_change: function(index, that) {
			var val = parseFloat($(that).val())
			
            if (isNaN(val)) {
				val = null
			}

            if (chart.g.yAxis.domain[0] !== null && chart.g.yAxis.domain[0] >= val) {
                chart.g.yAxis.domain[1] = null;
            } else {
			    chart.g.yAxis.domain[1] = val;
            }

			chart.setYScales();
			
            ChartBuilder.redraw()
			ChartBuilder.inlineAllStyles();
		},
		axis_min_change: function(index, that) {
			var val = parseFloat($(that).val())
			if(isNaN(val)) {
				val = null
			}

            if (chart.g.yAxis.domain[1] !== null && chart.g.yAxis.domain[1] <= val) {
                chart.g.yAxis.domain[0] = null;
            } else {
                chart.g.yAxis.domain[0] = val;
            }

			chart.setYScales();
			
            ChartBuilder.redraw()
			ChartBuilder.inlineAllStyles();
		},
		axis_tick_override_change: function(index,that) {
			var val = $(that).val()
			val = val.split(',')
			if(val.length > 1) {
				for (var i = val.length - 1; i >= 0; i--){
					val[i] = parseFloat(val[i])
				};
			}
			else {
				val = null
			}
			chart.g.yAxis.tickValues = val
			chart.setYScales();
			ChartBuilder.redraw()
			ChartBuilder.inlineAllStyles();
		}
	},
	showInvalidData: function(e) {
        e = e || 'Data could not be parsed.';

        $('#invalidDataSpan').text(e);
		$('#inputDataHeading').addClass('inputDataHInvData');
		$('#invalidDataSpan').removeClass('hide');
	},
	hideInvalidData: function() {
		$('#inputDataHeading').removeClass('inputDataHInvData');
		$('#invalidDataSpan').addClass('hide');
	}
}

// Create default config for chartbuilder
ChartBuilder.getDefaultConfig = function() {
  var chartConfig = {};
  
  chartConfig.colors = ['#db4730','#e58d3c','#f0c74f','#04807e','#4da9da',
  						'#6d2217','#72461d','#776326','#04403e','#26546d',
						'#a43424','#ab6a2d','#b3943a','#04605d','#3a7ea3',
						'#db4730','#e58d3c','#f0c74f','#04807e','#4da9da',
						'#e47563','#ebaa69','#f3d576','#4ca09e','#7bbfe3',
						'#eea397','#f2c69b','#f7e3a2','#88c0bf','#7bbfe3',
						'#f6d1cb','#f9e2cc','#fbf1d0','#c4dfdf','#d2eaf6'];
  
  return chartConfig;
}

ChartBuilder.formatDate = function(d) {
    var date = (d.getMonth() + 1) +
        '-' + (d.getDate() + 1) +
        '-' + (d.getFullYear());

    var hours = d.getHours();
    var minutes = d.getMinutes();
    var ampm = hours >= 12 ? 'pm' : 'am';
    hours = hours % 12;
    hours = hours ? hours : 12;
    minutes = minutes < 10 ? '0' + minutes : minutes;
    var time = hours + ':' + minutes + ' ' + ampm;

    return date + ' ' + time;
}

ChartBuilder.loadStoredCharts = function() {
  	var savedCharts = ChartBuilder.getLocalCharts().reverse();
  	var chartSelect = d3.select('#previous_charts');

    chartSelect.selectAll('option').remove();
  	
  	chartSelect.selectAll('option')
  		.data(savedCharts)
  		.enter()
  		.append('option')
  		.text(function(d) {
            var created = ChartBuilder.formatDate(new Date(d.created));
            return d.name ? d.name + ' (' + created  + ')' : 'Untitled Chart (' + created + ')'
        })

    $('#previous_charts').trigger('chosen:updated');
}

// Starts applicatoin given config object
ChartBuilder.start = function(config) {

  // Create config
  var chartbuilderDefaultConfig = ChartBuilder.getDefaultConfig();
  var chartConfig = $.extend(defaultGneissChartConfig, chartbuilderDefaultConfig, config);
  
  $(document).ready(function() {

	$('#chartContainer').css('height', 480)
    chart = Gneiss.build(chartConfig)
  	
  	//scale it up so it looks good on retina displays
  	$('#chart').attr('transform', 'scale(2)')
  	
    var chartSelect = $('#previous_charts').chosen()
        .on('change',function() {
            ChartBuilder.loadLocalChart(d3.select(this.selectedOptions[0]).data()[0])
  		});
 
    ChartBuilder.loadStoredCharts(); 
  			
  	$('#createImageButton').click(function() {
		if(!$('#download-modal').hasClass('in')) {
            if ($('#chart_title').val() == '') {
                alert('You must supply a chart title.');
                return false;
            }

            $('#createImageButton p').text('Reset');

  		    ChartBuilder.inlineAllStyles();
			ChartBuilder.createChartImage();
		} else {
            $('#createImageButton p').text('Create Image of Chart');
        }
  	})
  	
    // Set default example
    $('#csvInput').val('a,b,c\nFirst,1,2\nSecond,3,4\nThird,5,6');
  	
  	
  	$('#right_axis_prefix').keyup(function() {
  		ChartBuilder.actions.axis_prefix_change(0,this)
  	})
  	
  	$('#right_axis_suffix').keyup(function() {
  		ChartBuilder.actions.axis_suffix_change(0,this)
  	})
  	
  	$('#right_axis_tick_num').change(function() {
  		ChartBuilder.actions.axis_tick_num_change(0,this)
  	})

    $('#right_axis_max').keyup(function() {
  		ChartBuilder.actions.axis_max_change(0,this)
  	})
  	
  	$('#right_axis_min').keyup(function() {
  		ChartBuilder.actions.axis_min_change(0,this)
  	})
  	
  	$('#right_axis_tick_override').keyup(function() {
  		ChartBuilder.actions.axis_tick_override_change(0,this)
  	})

    $('#csvInput').keyup(function() {
  		//check if the data is different
  		if( $(this).val() != ChartBuilder.curRaw) {
  			//cache the the raw textarea value
  			ChartBuilder.curRaw = $(this).val()
  			
  			var csv = $('#csvInput').val();

            try {
  			    var newData = ChartBuilder.getNewData(csv);
            } catch(e) {
				ChartBuilder.showInvalidData(e);
  				return;
            }
  
  			dataObj = ChartBuilder.makeDataObj(newData);

  			if (dataObj == null) {
				ChartBuilder.showInvalidData();
  				return;
  			}

			ChartBuilder.hideInvalidData();
            ChartBuilder.createTable(newData);
  
  			dataObj = ChartBuilder.mergeData(dataObj);
  			
  			chart.g.xAxisRef = dataObj.data.shift().data;
  			chart.g.series = dataObj.data;

            // Regenerate axes from data or min/max
            chart.g.yAxis.domain = [null, null];
            $("#right_axis_max").keyup();
            $("#right_axis_min").keyup();

  			ChartBuilder.redraw();
  			ChartBuilder.inlineAllStyles();
  		}
  	}).keyup() 

  	$('#chart_title').keyup(function() {
  		var val = $(this).val()

  		chart.g.title = val;
  		
  		chart.redraw();
  		
  		chart.g.titleLine.text(chart.g.title)
  	}).keyup();

  	// Clicking download closes the download modal
  	$('#downloadImageLink').on('click', function(){
  		$('#download-modal').modal('hide');
  	});
  	
  	
  })
};
