/* Utility for synchronized multiplayer network game */

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

