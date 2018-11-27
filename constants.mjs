export const imageStyle = 'margin: 5px; height: auto; min-height: 25px; max-height: 120px; width: auto; max-width: 500px;';

const faces1 = [
	':)', ':(', ';)', ':D', ';;)', ':-/', ':x', ':8}', ':p',
	':*', ':O', 'X-(', ';\\', 'B-)', ':-s', ']:)', ':_|', ':^O', ':|',
	'/:)', 'O:)', ':-B', '=;', 'I-)', '8-|', ':-8', ':-$',
	'[-(', ':o)', '8-}', '(:|', '=P~', ':-?', '#-o', '=D=',
	':@)', '3:-O', ':{|}', '~:-', '@};-', '%%-', '**==', '(~~)', '~o)',
	'*-:)', '8-X', '=:}', ']-}', ':-L', ']):)', '[-o|', '@-)',
	'$-)', ':-oo', ':^o', 'b-(', '=}=', '[-X', '\\:D/', '[:D]',
	'::tal::'
];
const faces2 = [
	'happy', 'sad', 'wink', 'grin', 'batting', 'confused', 'love', 'blush', 'tongue',
	'kiss', 'shock', 'angry', 'mischief', 'cool', 'worried', 'devil', 'cry', 'laugh', 'plain',
	'raised_brow', 'angel', 'nerd', 'talk_hand', 'sleep', 'rolling_eyes', 'sick', 'shhh',
	'not_talking', 'clown', 'silly', 'tired', 'drooling', 'thinking', 'doh!', 'applause',
	'pig', 'cow', 'monkey', 'chicken', 'rose', 'good_luck', 'flag', 'pumpkin', 'coffee',
	'idea', 'skull', 'alien_1', 'alien_2', 'frustrated', 'cowboy', 'praying', 'hypnotized',
	'money_eyes', 'whistling', 'liarliar', 'beatup', 'peace', 'shame_on_you', 'dancing', 'hugs',
	'tal'
];

//lookup tables to find the ID of a matched face. We're basically going to swap key/value pairs here.
export let faces1lookup = {};
export let faces2lookup = {};
faces1.forEach((face, i) => { faces1lookup[face] = i + 1 }); //this is so when we find a match we can get which number it is to make the file name: eg 1.gif
faces2.forEach((face, i) => { faces2lookup[face] = i + 1 });
faces1lookup['::tal::'] = faces2lookup['tal'] = 'facetal'; //Tal doesn't follow naming convention (he's a wild guy)

const faces1esc = faces1.map(face => face.replace(/\\/g, '\\\\').replace(/([\[\]\{\}\^\$.\|\?\*\+\(\)])/g, '\\$1')); //escape special chars for RegExp
//new massive RegExp to find all faces without looping
export const faces1RE = new RegExp('(?:\\s)(' + faces1esc.join('|') + ')', 'g'); //note that these smileys have to have a space before them
export const faces2RE = new RegExp('\\[face_(' + faces2.join('|') + ')\\]', 'gi');

export const tags = ['b', 'i', 'u', 'ol', 'ul', 'li', 'blockquote']; //simple tags that require no special parsing (actually it appears blockquote works like quote. Maybe I'll fix that later)
export const tagsRE = tags.map(tag => new RegExp('\\[(' + tag + ')\\](?=[^]*\\[\\/\\1\\])([^]*?)\\[\\/\\1\\]', 'gi'));
