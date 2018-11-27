import { tags, tagsRE, faces1RE, faces2RE, faces1lookup, faces2lookup, imageStyle } from './constants';

/**
 * 
 * @param {string} input markup code
 * @returns {string} HTML string representation of markup
 */
export function parse(input) {
	//this is the new code that runs a single RegExp for each type of face. I calculate it runs in 75% of the time the old code took.
	input = input.replace(faces1RE, function ($0, $1) {
		var faceId = faces1lookup[$1];
		return ' <img src="http://media.ign.com/boardfaces/' + faceId + '.gif" alt="' + faces2[faceId - 1] + '" class="BoardFace">'
	});

	input = input.replace(faces2RE, function ($0, $1) {
		var faceId = faces2lookup[$1.toLowerCase()];
		return '<img src="http://media.ign.com/boardfaces/' + faceId + '.gif" alt="' + faces2[faceId - 1] + '" class="BoardFace">'
	});

	for (var i = 0; i < tags.length; i++) {
		input = input.replace(tagsRE[i], '<$1>$2</$1>');
	}

	//most of these RegExps employ a lookahead to make sure an end tag even exists before doing a lazy search to find it. lazy search without guaranteed succes is doom
	input = input.replace(/\[color=([^\s;\]]*)\](?=[^]*\[\/color\])([^]*?)\[\/color\]/gi, '<font color="$1">$2</font>'); //colors
	input = input.replace(/\[hl=([^\s;\]]*)\](?=[^]*\[\/hl\])([^]*?)\[\/hl\]/gi, '<span style="background-color: $1;">$2</span>'); //highlight

	input = input.replace(/\[hr\]/gi, '<hr noshade="noshade">'); //hr tag

	input = input.replace(/\[link=((?:f|ht)tps?:\/\/[^\s\]]*)\](?=[^]*\[\/link\])([^]*?)\[\/link\]/gi, '<a href="$1" title="$1" target="boardLink" class="BoardRowBLink">$2</a>'); //links - allows http, https, ftp, ftps. title attribute added so peeps can hover
	input = input.replace(/\[image=(http:\/\/[^\s\]]*\.(?:jpe?g|gif|png|bmp))\]/gi, '<a target="_blank" href="$1"><img src="$1" style="' + imageStyle + '"></a>'); //images - end in .jpg, .jpeg, .gif, .png, and .bmp. Boards actually creat a link around the image to the picture's url

	//input = input.replace(/(^|\s|>)(https?:\/\/[^\s<\[]*)/gi, '$1 <a href="$2" title="$2" class="BoardRowBLink">$2</a> '); //auto url thingy, but isn't quite right
	input = input.replace(/(^|\s|>)(https?:\/\/[0-9a-z\-.,_~\/\?:;\\\!\@\#\$\%\^\&\*\(\)\=\+\"\u00a0-\u02c1\u02c6-\u02d1\u02e0-\u02e4\u02ee]*)/gi, '$1 <a href="$2" title="$2" class="BoardRowBLink">$2</a> '); //this code from carl and modified a bit by me

	input = parseQuotes(input).output;

	input = input.replace(/\n/g, '<br>');  //returns to br

	return input;
}

/**
 * 
 * @typedef {Object} ParseQuotesResult result of parseQuotes function
 * @typedef {string} ParseQuotesResult.output html output
 * @typedef {string} ParseQuotesResult.remaining markup code unparsed
 * @typedef {boolean} ParseQuotesResult.foundEnd if an end tag was just found
 */

/**
 * 
 * @param {string} input markup code
 * @param {number} [depth=0] how mnany quotes deep currently
 * @returns {ParseQuotesResult}
 */
function parseQuotes(input, depth = 0) {
	var result = {
		output: '',
		remaining: '',
		foundEnd: false,
	}

	while (input.length > 0) {
		var nextStart = input.match(/\[quote=([^\s;\]]*)\]/);
		var nextEndIndex = input.indexOf('[/quote]');

		//we're not too deep and there's a start tag before an end tag
		if (depth < 3 && nextStart && nextStart.index < nextEndIndex) {
			result.output += input.substring(0, nextStart.index);
			var after = input.substr(nextStart.index + nextStart[0].length);
			var innerResult = parseQuotes(after, depth + 1);
			result.output += innerResult.foundEnd ?
				'<blockquote><strong>' + nextStart[1] + '</strong> posted:<hr noshade="noshade" />' + innerResult.output + '<hr noshade="noshade" /></blockquote>' :
				nextStart[0] + innerResult.output;
			input = innerResult.remaining;
		}
		//no more start tags, but we're in a start tag and there is an end tag
		else if (depth > 0 && nextEndIndex != -1) {
			result.foundEnd = true;
			result.output += input.substring(0, nextEndIndex);
			result.remaining = input.substr(nextEndIndex + 8);
			return result;
		}
		//nothing more to do
		else {
			result.output += input;
			return result;
		}
	}

	return result;
}