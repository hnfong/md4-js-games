function g(name)
{
	return document.getElementById(name);
}

function debug(txt)
{
	var x = document.createElement('div');
	x.innerHTML = txt;
	document.body.appendChild(x);
}

