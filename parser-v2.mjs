import jsdom from 'jsdom';

const { document } = (new jsdom.JSDOM(``)).window;

/**
 * 
 * @param {string} markup markup code
 * @param {HTMLElement} elm the element to append the results to
 * @param {number} [startPos=0] where to start parsing from
 */
export function parse(markup, elm, startPos = 0) {
	//console.log('parse called: ', elm.tagName, 'looking at "', markup.substring(startPos)), '"';
	var nextElm = elm;
	var nextPos = startPos + 1;
	var openBracket = markup.indexOf('[', startPos);
	var nextReturn;

	//need to figure out how to handle auto linking. could have a seperate function run before parse that looks for all valid links and returns and handles them as we get to them rather than searching for them here

	//handle all the linebreaks before the next tag or end of string
	while ((nextReturn = markup.indexOf('\n', startPos)) >= 0 && (openBracket < 0 || nextReturn < openBracket)) {
		elm.appendChild(document.createTextNode(markup.substring(startPos, nextReturn)));
		elm.appendChild(document.createElement('br')); //add the return
		startPos = nextReturn + 1; //continue after the return
	}

	if (openBracket >= 0) {
		var nextCloseBracket = markup.indexOf(']', openBracket + 1);
		if (nextCloseBracket != -1) {
			var tag = markup.substring(openBracket + 1, nextCloseBracket);
			var elmTagName = elm.tagName.toLowerCase();
			var tagMatch = false;

			elm.appendChild(document.createTextNode(markup.substring(startPos, openBracket)));

			//basic tags. really the list items should test to make sure they're in an ol and not in another li
			if (/^(?:[biu]|blockquote|[ou]l|li)$/.test(tag)) {
				var testParentTag = elm;
				var testTagName = tag.toUpperCase();
				//while(testParentTag.tagName != testTagName && (testParentTag = testParentTag.parentNode)) {} //find a parent of the same type
				// if (testParentTag)
				// {
				// 	elm.appendChild(document.createTextNode('[' + tag + ']'));
				// 	nextPos = nextCloseBracket + 1; //continue search after this open bracket
				// }
				// else {

				//console.log('gonna make new tag with ', tag);

				var basicElm = document.createElement(tag);
				elm.appendChild(basicElm);

				nextElm = basicElm;
				nextPos = nextCloseBracket + 1;
				// }
			}
			else if (tag == 'hr') {
				//console.log('valid hr tag');

				elm.appendChild(document.createElement('hr')); //do not set next elm
				nextPos = nextCloseBracket + 1;
			}
			else if (tagMatch = tag.match(/^color=([^\s;\]]*)$/)) {
				//console.log('valid color tag');

				var color = document.createElement('span');
				color.setAttribute('color', true); //just to mark what this tag is for
				color.style.color = tagMatch[1];

				nextElm = elm.appendChild(color);
				nextPos = nextCloseBracket + 1;
			}
			else if (tagMatch = tag.match(/^hl=([^\s;\]]*)$/)) {
				//console.log('valic hilite tag');

				var hilite = document.createElement('span');
				hilite.setAttribute('hilite', true);
				hilite.style.backgroundColor = tagMatch[1];

				nextElm = elm.appendChild(hilite);
				nextPos = nextCloseBracket + 1;
			}
			else if (tagMatch = tag.match(/link=((?:f|ht)tps?:\/\/\S*)/)) {
				//console.log('valid link tag');

				var link = document.createElement('a');
				link.setAttribute('href', tagMatch[1]);

				nextElm = elm.appendChild(link);
				nextPos = nextCloseBracket + 1;
			}
			else if (tagMatch = tag.match(/image=(http:\/\/\S*\.(?:jpe?g|gif|png|bmp))/)) {
				//console.log('valid image tag');

				var imgWrapper = document.createElement('span');
				var a = document.createElement('a');
				var img = document.createElement('img');

				imgWrapper.setAttribute('class', 'imgWrapper');
				a.setAttribute('href', tagMatch[1]);
				img.setAttribute('src', tagMatch[1]);
				//do not set nextElm
				elm.appendChild(imgWrapper).appendChild(a).appendChild(img);
				nextPos = nextCloseBracket + 1;
			}
			else if (tagMatch = tag.match(/^quote=([^\s;\]]*)$/)) {
				//console.log('valid quote tag ', tag);

				var quote = document.createElement('blockquote');
				quote.setAttribute('quote', true);
				var username = document.createElement('strong');
				username.appendChild(document.createTextNode(tagMatch[1]));
				quote.appendChild(username);
				quote.appendChild(document.createTextNode(' posted:'));
				quote.appendChild(document.createElement('hr'));

				nextElm = elm.appendChild(quote);
				nextPos = nextCloseBracket + 1;
			}
			//close tag
			else if (tag[0] == '/') {
				var closeTag = tag.substring(1);
				/*if(/^(?:[biu]|blockquote|[ou]l|li|quote|hr|image|link)$/.test(closeTag)) //valid close tags
				{
					if($elm.
				}*/
				if (
					(/^(?:[biu]|blockquote|[ou]l|li)$/.test(closeTag) && closeTag == elmTagName) || //basic close tags
					(closeTag == 'color' && elmTagName == 'span' && elm.getAttribute('color')) || //color close
					(closeTag == 'hl' && elmTagName == 'span' && elm.getAttribute('hilite')) || //hilite close
					(closeTag == 'link' && elmTagName == 'a')
				) {
					nextElm = elm.parentNode;
					nextPos = nextCloseBracket + 1;
				}
				else if (closeTag == 'quote' && elmTagName == 'blockquote' && elm.getAttribute('quote')) {
					elm.appendChild(document.createElement('hr')); //close quotes get an hr

					nextElm = elm.parentNode;
					nextPos = nextCloseBracket + 1;
				}
				//not a valid close tag
				else {
					elm.appendChild(document.createTextNode('[/'));
					nextPos = openBracket + 2; //continue search after this open bracket
				}
			}
			//no valid markup tags found
			else {
				elm.appendChild(document.createTextNode('['));
				nextPos = openBracket + 1; //continue search after this open bracket
			}
		}
		else {
			nextPos = openBracket + 1;
		}
		parse(markup, nextElm, nextPos);
	}
	//no more markup
	else {
		elm.appendChild(document.createTextNode(markup.substring(startPos)));
	}
}