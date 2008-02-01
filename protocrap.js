/* for crappy legacy browsers! (IE5.0 for example) */
/* Abstract: The author hates polluting standard Javascript classes with fancy
 * crap. But this is different. You don't call array arrays if you don't have
 * these methods... */

if (typeof Array.prototype.push == 'undefined') {
	Array.prototype.push = function(obj) {
		this[this.length] = obj;
	};
}

if (typeof Array.prototype.shift == 'undefined') {
	Array.prototype.shift = function() {
		if (this.length == 0) return;
		var ret = this[0];
		for (var i = 1 ; i < this.length; i++ )
			this[i-1] = this[i];
		delete(this[this.length-1]);
		this.length--;
		return ret;
	};
}


if (typeof Array.prototype.pop == 'undefined') {
	Array.prototype.pop = function() {
		if (this.length == 0) return;
		var ret = this[this.length-1];
		delete(this[this.length-1]);
		this.length--;
		return ret;
	};
}


if (typeof encodeURIComponent == 'undefined') {
	// utf16to8() adapted from http://www.onicos.com/staff/iz/amuse/javascript/expert/utf.txt
	// "Free" license. Presumably OK
	function utf16to8(s) {
		var ret = new Array();
		for(var i = 0; i < s.length; i++) {
			var c = s.charCodeAt(i);
			if ((c >= 0x0000) && (c <= 0x007F)) {
				ret.push(c);
			} else if (c > 0x07FF) {
				ret.push(0xE0 | ((c >> 12) & 0x0F));
				ret.push(0x80 | ((c >>  6) & 0x3F));
				ret.push(0x80 | ((c >>  0) & 0x3F));
			} else {
				ret.push(0xC0 | ((c >>  6) & 0x1F));
				ret.push(0x80 | ((c >>  0) & 0x3F));
			}
		}
		return ret;
	}

	{
		var V = new Object();
		V['A'] = 'A'.charCodeAt(0);
		V['Z'] = 'Z'.charCodeAt(0);
		V['a'] = 'a'.charCodeAt(0);
		V['z'] = 'z'.charCodeAt(0);
		V['0'] = '0'.charCodeAt(0);
		V['9'] = '9'.charCodeAt(0);
		
		var excl = '-_.!~*\'()';
		var exclV = new Array();
		for (var i = 0 ; i < excl.length; i++) {
			exclV.push( excl.substring(i,i+1).charCodeAt(0) );
		}

		window.__encodeURIComponent_exclude_ranges = [ V['A'], V['Z'], V['a'], V['z'], V['0'], V['9'] ];
		window.__encodeURIComponent_exclude_chars = exclV;
	}
	
	function __encodeURIComponent_exclude(v) {
		for (var i = 0 ; i < __encodeURIComponent_exclude_chars.length; i++) {
			if (v == __encodeURIComponent_exclude_chars[i]) return true;
		}
		for (var i = 0 ; i < __encodeURIComponent_exclude_ranges.length; i+=2) {
			if (v >= __encodeURIComponent_exclude_ranges[i] &&
				v <= __encodeURIComponent_exclude_ranges[i+1]) return true;
		}
		return false;
	}

	window.encodeURIComponent = function(s) {
		var x = new Array('0','1','2','3','4','5','6','7','8','9','a','b','c','d','e','f');
		var chars = utf16to8(s); /* javascript internally uses utf-16. change to utf-8 since encodeURIComponent uses UTF-8 */
		var ret = new Array();

		for (var i = 0 ; i < chars.length; i++) {
			var v = chars[i];
			if ( __encodeURIComponent_exclude(v) ) {
				ret.push( String.fromCharCode( v ) );
				continue;
			}
			var hi = parseInt(chars[i] / 16);
			var lo = chars[i] % 16;
			ret.push('%'+x[hi]+x[lo]);
		}

		return ret.join('');
	}
}
