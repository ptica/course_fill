var request = require('request');
var cheerio = require('cheerio');
var _ = require('cheerio/node_modules/underscore');

var url = 'http://is.cuni.cz/studium/predmety/index.php?do=search&nazev=&kod=&match=substring&srch_nazev=0&srch_nazev=1&fak=&ustav=32-UFAL&trida=&klas=&ujmeno=&utyp=3&pvyjazyk=&sem=&pocet=&b=Hledej';
url = 'http://is.cuni.cz/studium/eng/predmety/index.php?do=search&nazev=&kod=&match=substring&srch_nazev=0&srch_nazev=1&fak=&ustav=32-UFAL&trida=&klas=&ujmeno=&utyp=3&pvyjazyk=&sem=&pocet=&b=Hledej';
if (!String.prototype.strip_degrees) {
	Object.defineProperty(String.prototype, 'strip_degrees', {
		value: function () {
			       var commaless = this.replace(/,/, '');
			       var parts = commaless.split(' ').filter(function(e,i,a) { return  !/\.|^MA$/.test(e) } );
			       return parts.join(' ');
		       },
		enumerable: false,
	});
}
if (!String.prototype.strip_update) {
	Object.defineProperty(String.prototype, 'strip_update', {
		value: function (update) {
			       return this.replace(update, '');
		       },
		enumerable: false,
	});
}

var results = {};

request(url, function(err, resp, body) {
	if (err) throw err;
	$ = cheerio.load(body);
	// BEWARE people without a link to struktura are left out!!!
	$('.tab1 td:nth-child(2) a.link2').each(function() {
		var $this = $(this);
		name = $this.text();
		results[name] = {
			sis_code: $this.text(),
			title: $this.closest('td').next().find('a.link2').text(),
			semester: $this.closest('td').next().next().text(),
			examination: $this.closest('td').next().next().next().text(),
			//position: $this.closest('ul').prevAll('h2').first().text(),
			//old_url: $this.next('a').attr('href'),
			detail_url: 'http://is.cuni.cz/studium/eng/predmety/index.php?do=predmet&kod=' + $this.text()
		};
	});
	//console.log(JSON.stringify(results, null, '\t'));
	//return;
	
	// NOW SCRAPE OBTAINED MFF URLS
	var items = Object.keys(results);
	var remaining = items.length;
	//remaining = 2;
	


	
	//for (var i=0; i<1; i++) {
	for (var i=0; i<items.length; i++) {
		var url = results[items[i]]['detail_url'];
		request(url, (function(i) { return function(err, resp, body) {
			if (err) throw err;
			$ = cheerio.load(body);
			var properties = {};
			$('.form_div .tab2 tr').each(function() {
				var property = $(this).find('th').text().trim();
				var value    = $(this).find('td').text().trim(); //$(this).prevAll('dt').first().text().trim();
				//console.log(property + ':' + value);
				
				// massaging
				if (property === 'Odkazy') {
					sis_href = $(this).find('a').first().attr('href');
					var parts  = /=(\d+)$/.exec(sis_href);
					sis_code = parts[1];
					properties['Sis code'] = sis_code;
				}
				properties[property] = value;
			});
			properties['annotation'] = {
				en: $('#pamela_A_ENG').html(),
				cs: $('#pamela_A_CZE').html()
			};
			properties['literature']= {
					en: $('#pamela_L_ENG').html(),
					cs: $('#pamela_L_CZE').html()
			};
			properties['exam_requirements']= {
					en: $('#pamela_P_ENG').html(),
					cs: $('#pamela_P_CZE').html()
			};
			properties['syllabus']= {
					en: $('#pamela_S_ENG').html(),
					cs: $('#pamela_S_CZE').html()
			};
			_.extend(results[items[i]], properties);
			//console.log(JSON.stringify(properties, null, '\t'));
			remaining -= 1;

			if (remaining == 0) {
				console.log(JSON.stringify(results));
			}
		}})(i));
	}
});

