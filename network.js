/* Utility for synchronized multiplayer network game */

/*
	Almost like a TCP-over-AJAX implementation. (though of course much less sophisticated)
	Guarantees that network messages are received in correct order by other players.

	Executes a callback when all other players ACK. otherwise resends the same msg.
*/

/*************************************************
	url: string
	session_id: integer
	player_id: integer
	players: list of player ids, including self.
	poll: integer in ms.
	default_callback: function reference (optional)
	retry: integer in ms. 0 for don't retry (optional)
**************************************************/

/*** incomplete code ***
function IndirectPlay(url,session_id,player_id,players,poll,default_callback,retry)
{
	this.url = url;
	this.session_id = session_id;
	this.player_id = player_id;
	this.poll = poll;
	this.default_callback = (default_callback == undefined? null: default_callback);
	this.retry = (retry == undefined? 5000 : retry);

	this.seq = 0; // sequence number
	this.recv_buffer = '';
	this.recv_packets = new Array();
	this.acks = new Array();
	this.custom_callback = {};

	this.send = function( msg, callback )
	{
		var sid = this.session_id;
		var pid = this.player_id;
		var msg = encodeURIComponent(msg);
		            // IDPLAY   sessionid   playerid      seq num/ACK      msg length        msg
		var postmsg = 'IDPLAY ' + sid + ' ' + pid + ' ' + this.seq + ' ' + msg.length + ' ' + msg;

		if ( callback != undefined ) this.custom_callback[seq] = callback;

		this.acks.push({});
		this.acks[this.seq]['count'] = 0;

		this.seq++;

		var ajaxmsg = 'msg='+ encodeURIComponent( msg );
		__idplay__ajax_async( this.url, ajaxmsg, this.begin_looking_for_ack );
	};

	this.recv = function() { __idplay__ajax_async(this.url, null, this.process_recv_data); }; 

	this.recv_loop = function()
	{
		this.recv();
		setTimeout(this.recv_loop, this.poll);
	};

	////// these are callbacks //////

	this.process_recv_data( http )
	{
		if ( http.status != 200 )
		{
			alert( 'Server error HTTP status = ' + http.status );
			throw( http );
		}

		var s = this.recv_buffer;

		s = s + http.responseText;

		var a = s.split('\n');
		for (var pk in a)
		{
			var x = pk.split(' ');
			var proto = x[0];
			var sid = parseInt(x[1]);
			var from_pid = parseInt(x[2]);

			if (proto != 'IDPLAY') continue;
			if (sid != this.session_id) continue;

			if (x[3] == 'ACK')
			{
				var to_pid = parseInt(x[4]);
				var seq = parseInt(x[5]);
				if (to_pid != this.pid) continue;

				if (this.ack[seq][from_pid] == undefined)
				{
					this.ack[seq]['count']++;
					this.ack[seq][from_pid] = 1;
				}
			} else {
				var seq = parseInt(x[3]);
				


			}
		}
	};

	this.begin_looking_for_ack

}
***/

// cross browser ajax object creation
/*Note: dubious copyright status*/
function __idplay__newHTTP() {
    var xmlhttp=false;
    /*@cc_on @*/
    /*@if (@_jscript_version >= 5)
    // JScript gives us Conditional compilation, we can cope with old IE versions.
    // and security blocked creation of the objects.
     try {
      xmlhttp = new ActiveXObject("Msxml2.XMLHTTP");
     } catch (e) {
      try {
       xmlhttp = new ActiveXObject("Microsoft.XMLHTTP");
      } catch (E) {
       xmlhttp = false;
      }
     }
    @end @*/
    if (!xmlhttp && typeof XMLHttpRequest!='undefined') {
        try {
            xmlhttp = new XMLHttpRequest();
        } catch (e) {
            xmlhttp=false;
        }
    }
    if (!xmlhttp && window.createRequest) {
        try {
            xmlhttp = window.createRequest();
        } catch (e) {
            xmlhttp=false;
        }
    }
    return xmlhttp;
}

function __idplay__ajax_async(url, post_content, func)
{
    var post_string;
    if (typeof post_content == 'string') {
        post_string = post_content;
    } else {
        post_string = util.hash2request(post_content);
    }
    var http = __idplay__newHTTP();
    if (!http) return false;

    http.open("POST", url, true);
	http.setRequestHeader('content-type', 'application/x-www-form-urlencoded');
    http.onreadystatechange = function () {
        if (http.readyState == 4) {
            try {
                http.status;
                http.responseText;
            } catch (e) {
                return false;
            }
            func(http);
        }

    };

    http.send(post_string);
}

