import { tags, tagsRE, faces1RE, faces2RE, faces1lookup, faces2lookup } from './constants';
import jsdom from 'jsdom';

const { document } = (new jsdom.JSDOM(``)).window;

String.prototype.matchAll = function (re) {
	var match;
	var matches = [];
	while ((match = re.exec(this)) != null) {
		//console.log(match);
		matches.push(match);
	}
	return matches;
};

/**
 * 
 * @param {string} markup markup code
 * @returns {HTMLElement} HTML representation of markup
 */
export function parse(markup) {
	var markupEnd = markup.length;
	var position = 0;
	var topNode = document.createElement('div')
	var end;

	var currentNode = topNode;
	var nextOpenBracket = markup.indexOf('[', position);
	var nextReturn = markup.indexOf('\n', position);
	// should actually be a search for regexp /(?:f|ht)tps?\/\//
	var nextLink = markup.indexOf('http://', position);
	var allFaces = markup.matchAll(faces1RE);
	var nextFace = allFaces.shift();

	//console.log('all faces: ', allFaces);

	var least = function () {
		//return arguments.sort().shift();
		var least = markupEnd;
		for (var i = 0; i < arguments.length; i++)
			if (arguments[i] >= 0 && arguments[i] < least)
				least = arguments[i];

		return least;
	};

	var addText = function () {
		end = least(nextOpenBracket, nextReturn, nextLink, nextFace && nextFace.index);
		let val = markup.substring(position, end);
		currentNode.appendChild(document.createTextNode(val));
		position = end;
		//console.log('adding text: ', val, '; end at: ', end);
	};

	while (position < markupEnd)// && prompt('continue?', 'yes'))
	{
		//console.log('starting loop. position: ', position, ' of ', markupEnd, '; [: ', nextOpenBracket, '; \\n: ', nextReturn, '; http: ', nextLink);
		if (position == nextOpenBracket) {
			//console.log('at an open bracket');
			var nextCloseBracket = markup.indexOf(']', nextOpenBracket + 1);
			//can't be a tag if there's no close bracket
			if (nextCloseBracket == -1) {
				//console.log('there is no close bracket');
				nextOpenBracket = markup.indexOf('[', nextOpenBracket + 1);
				addText();
			}
			//possible open tag
			else if (markup.charAt(nextOpenBracket + 1) != '/') {
				//console.log('at [');
				let tag = markup.substring(nextOpenBracket + 1, nextCloseBracket);
				let tagMatch;
				//console.log('gonna test tag ', tag);
				if (tag.indexOf('face_') == 0) {
					var faceName = tag.substring(5);
					var faceId = faces2lookup[faceName];
					if (faceId) //look up what face
					{
						var face = document.createElement('img');
						face.src = 'http://media.ign.com/boardfaces/' + faceId + '.gif';

						currentNode.appendChild(face);
						position = nextCloseBracket + 1;
						nextOpenBracket = markup.indexOf('[', position);
					}
					else {
						nextOpenBracket = markup.indexOf('[', nextOpenBracket + 1);
						addText();
					}
				}
				//basic tags
				else if (/^(?:[biu]|blockquote|[ou]l|li)$/.test(tag)) {
					//console.log('adding ', tag);
					let node = document.createElement(tag);

					currentNode.appendChild(node);
					currentNode = node;

					position = nextCloseBracket + 1;

					nextOpenBracket = markup.indexOf('[', position);
				}
				else if (tag == 'hr') {
					//do not set next elm
					currentNode.appendChild(document.createElement('hr'));

					position = nextCloseBracket + 1;
					nextOpenBracket = markup.indexOf('[', position);
				}
				else if (tagMatch = tag.match(/^color=([^\s;\]]*)$/)) {
					//console.log('valid color tag');

					var color = document.createElement('span');
					//just to mark what this tag is for
					color.setAttribute('color', true);
					color.style.color = tagMatch[1];

					currentNode = currentNode.appendChild(color);
					position = nextCloseBracket + 1;
					nextOpenBracket = markup.indexOf('[', position);
				}
				else if (tagMatch = tag.match(/^hl=([^\s;\]]*)$/)) {
					//console.log('valic hilite tag');

					var hilite = document.createElement('span');
					hilite.setAttribute('hilite', true);
					hilite.style.backgroundColor = tagMatch[1];

					currentNode = currentNode.appendChild(hilite);
					position = nextCloseBracket + 1;
					nextOpenBracket = markup.indexOf('[', position);
				}
				else if (tagMatch = tag.match(/link=((?:f|ht)tps?:\/\/\S*)/)) {
					//console.log('valid link tag');

					var link = document.createElement('a');
					link.setAttribute('href', tagMatch[1]);

					currentNode = currentNode.appendChild(link);
					position = nextCloseBracket + 1;
					nextOpenBracket = markup.indexOf('[', position);
					nextLink = markup.indexOf('http://', position);
				}
				else if (tagMatch = tag.match(/image=(http:\/\/\S*\.(?:jpe?g|gif|png|bmp))/)) {
					//console.log('valid image tag');

					var imgWrapper = document.createElement('span');
					var a = document.createElement('a');
					var img = document.createElement('img');

					imgWrapper.setAttribute('class', 'imgWrapper');
					a.setAttribute('href', tagMatch[1]);
					img.setAttribute('src', tagMatch[1]);

					currentNode.appendChild(imgWrapper).appendChild(a).appendChild(img);

					position = nextCloseBracket + 1;
					nextOpenBracket = markup.indexOf('[', position);
					nextLink = markup.indexOf('http://', position);
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

					currentNode = currentNode.appendChild(quote);
					position = nextCloseBracket + 1;
					nextOpenBracket = markup.indexOf('[', position);
				}
				else //not a valid tag so add as text
				{
					nextOpenBracket = markup.indexOf('[', nextOpenBracket + 1);
					addText();
				}
			}
			//possible end tag
			else {
				//console.log('at [/');
				let tag = markup.substring(nextOpenBracket + 2, nextCloseBracket);
				var nodeName = currentNode.tagName.toLowerCase();
				if (
					(/^(?:[biu]|blockquote|[ou]l|li)$/.test(tag) && nodeName == tag) || //basic close tags
					(tag == 'link' && nodeName == 'a') || //link close
					(tag == 'color' && nodeName == 'span' && currentNode.getAttribute('color')) || //color close
					(tag == 'hl' && nodeName == 'span' && currentNode.getAttribute('hilite'))    //hilite close
				) {
					//console.log('closing ', tag);
					currentNode = currentNode.parentNode;
					position = nextCloseBracket + 1;

					nextOpenBracket = markup.indexOf('[', position);
				}
				else if (tag == 'quote' && nodeName == 'blockquote' && currentNode.getAttribute('quote')) {
					currentNode.appendChild(document.createElement('hr')); //close quotes get an hr

					currentNode = currentNode.parentNode;
					position = nextCloseBracket + 1;

					nextOpenBracket = markup.indexOf('[', position);
				}
				else //not a valid close
				{
					//console.log('not a valid close tag. adding as text');
					nextOpenBracket = markup.indexOf('[', nextOpenBracket + 1);
					addText();
				}
			}
		}
		else if (position == nextReturn) {
			//console.log('at a return');
			br = document.createElement('br');

			currentNode.appendChild(br);
			position++;

			nextReturn = markup.indexOf('\n', position);
		}
		//auto link
		else if (position == nextLink) {
			//console.log('at an auto link');
			end = least(nextOpenBracket, nextReturn, markup.indexOf(' ', position));
			val = markup.substring(position, end);

			link = document.createElement('a');
			link.setAttribute('href', val);
			link.appendChild(document.createTextNode(val));

			currentNode.appendChild(link);
			position = end;

			nextLink = markup.indexOf('http://', position);
		}
		else if (nextFace && (position == nextFace.index)) {
			var face = document.createElement('img');
			//console.log(nextFace[1], faces1lookup);
			face.src = 'http://media.ign.com/boardfaces/' + faces1lookup[nextFace[1]] + '.gif';

			currentNode.appendChild(face);
			position += nextFace[0].length;
			nextFace = allFaces.shift();
			nextOpenBracket = markup.indexOf('[', position);
		}
		//text
		else {
			addText();
		}

	}
	return topNode;
}