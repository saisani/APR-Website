
var trnDidHeaderScroll;
var trnLastHeaderScrollTop = 0;
var trnHeaderScrollDelta = 5;
var trnHeaderHeight = document.getElementById('trn-header').clientHeight;

function trnInitializeHeader() {
	document.getElementById("trn-searchfield").addEventListener('focus', trnSearchfieldFocus);
	document.getElementById("trn-searchfield").addEventListener('blur', trnSearchfieldBlur);
	document.getElementById("trn-searchfield").addEventListener('keyup', trnSearchfieldSubmit);

	window.addEventListener('mousedown', function (e) { trnWindowClick(e); })


	var activeSearchPlatform = localStorage.getItem('search-platform') || 3;

    document.querySelectorAll("#trn-header .search-platform").forEach(function (element, i) {
        element.addEventListener('click', trnSearchPlatformClick);
        if (element.getAttribute('data-platform') === activeSearchPlatform) {
            element.classList.add('active');
            element.style.color = element.getAttribute('data-color');
        }
    });

    window.addEventListener('scroll', trnWindowScroll);
	trnWindowScroll();

	setInterval(function () {
		if (trnDidHeaderScroll) {
			trnHasHeaderScrolled();
            trnDidHeaderScroll = false;
            document.getElementById('trn-searchfield').blur();
		}
	}, 250);

	trnLoadSuggestionList();
}
trnInitializeHeader();

function trnWindowClick(e) {
	if (nearestElement(e.target, '#trn-search')) {
		trnSearchClicked = true;
	} else {
		trnSearchClicked = false;
	}

	if (e.target.matches(".submenu-btn") || nearestElement(e.target, '.has-submenu')) {
		if (e.target.nodeName === 'A' && !e.target.classList.contains('submenu-btn')) {
			return;
		}
		e.preventDefault();

		if (!e.target.parentElement.classList.contains('opened')) {
			trnHideAllSubmenus();
			e.target.parentElement.classList.add('opened');

			// Fix for iOS submenus not showing in the horizontal navigation.
			// This is because issues with the overflow menu.

			// What this does is make the menu unscrollable and sets the scroll
			// position as a static value of the navigation header. This makes 
			// sure that the menu doesn't jump to the home when openeing a menu.
			if (/iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream) {
				var mainMenu = document.querySelector('#trn-header .main-menu');
				var navMenu = document.querySelector('#trn-header .navigation-bar');
				navMenu.style.width = mainMenu.scrollWidth;
				navMenu.style.marginLeft = -mainMenu.scrollLeft + 'px';
				mainMenu.style.overflow = 'unset';
			}
		} else {
			trnHideAllSubmenus();
		}
	} else {
		trnHideAllSubmenus();
	}
}

function trnHideAllSubmenus() {
	var menus = document.querySelectorAll('#trn-header .has-submenu');
	for (var i in menus) {
		if (menus[i].classList !== undefined)
			menus[i].classList.remove('opened');
	}

	// Undo any iOS related tricks when closing the submenu.
	if (/iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream) {
		var mainMenu = document.querySelector('#trn-header .main-menu');
		var navMenu = document.querySelector('#trn-header .navigation-bar');
		navMenu.style.width = '';
		navMenu.style.marginLeft = '';
		mainMenu.style.overflow = '';
	}
}

function trnWindowScroll() {
	// Are we at the top of the page?
	if (window.scrollY === 0) {
		document.getElementById("trn-header").classList.add("at-top");
	} else
		document.getElementById("trn-header").classList.remove("at-top");

	//document.activeElement.blur();

	trnDidHeaderScroll = true;
}

function trnHasHeaderScrolled() {
	var st = window.scrollY;

	// Make sure they scroll more than delta
	if (Math.abs(trnLastHeaderScrollTop - st) <= trnHeaderScrollDelta)
		return;

	// If they scrolled down and are past the navbar, add class .nav-up.
	// This is necessary so you never see what is "behind" the navbar.

	if (st > trnLastHeaderScrollTop && st > trnHeaderHeight) {
		// Scroll Down
		document.getElementById("trn-header").classList.add("nav-up");
		trnHideAllSubmenus();
	} else {

		var windowHeight = Math.max(
			document.documentElement.clientHeight,
			window.innerHeight || 0);
		var documentHeight = Math.max(
				document.body.offsetHeight,
        document.documentElement.clientHeight
    );

		if (st + windowHeight < documentHeight) {
			document.getElementById("trn-header").classList.remove('nav-up');
		}
	}

	trnLastHeaderScrollTop = st;
}


function trnSearchfieldFocus() {
	var field = document.getElementById("trn-search");

	field.classList.add('opened');
	field.classList.add('has-query');
}

var trnSearchClicked = false;
function trnSearchfieldBlur() {
	var field = document.getElementById("trn-search");


	setTimeout(function () {
		if (trnSearchClicked) {
			document.getElementById("trn-searchfield").focus();
			trnSearchClicked = false;
		}
		else {
			field.classList.remove('opened');
			if (document.getElementById("trn-searchfield").value === '')
				field.classList.remove('has-query');
		}
	}, 150)
}

function trnSearchfieldSubmit(e) {
	if (e.keyCode === 13) {
		var name = document.getElementById("trn-searchfield").value.trim();
		if (name.length > 0) {
            if (trnHeader !== undefined) {
				trnHeader.searchSubmit(name);
			}
					
		}
	}
}

function trnSearchPlatformClick(e) {
	var element = e.target || e.srcElement;

	localStorage.setItem('search-platform', element.getAttribute('data-platform'));

    document.querySelectorAll('.search-platform').forEach(function (el, i) {
        el.classList.removeClass('active');
        el.style.color = '';
    });

	element.classList.add('active');
	element.style.color = element.getAttribute('data-color');
	e.preventDefault();
	trnSearchClicked = true;

}

function trnLoadSuggestionList() {
    if (typeof trnHeader === "undefined")
        return;

	var suggestionList = document.getElementById('suggestion-list');

	if (localStorage === null) return;

	var recent = localStorage.getItem('recentv3') || '';
	var arr = recent !== '' ? JSON.parse(recent) : [];

	if (arr.length > 0) {
		suggestionList.innerHTML = '';

		for (var i in arr) {
			if (i > 6)
				return;

			var item = arr[i];

			var h = trnHeader.recentHtmlFormat(item.console);            

            while (h.indexOf('{0}') > 0) {
                h = h.replace('{0}', item.name);
            }

			suggestionList.innerHTML += h;
		}
	}


}

function nearestElement(el, selector) {
	while (el) {
		if (el.matches(selector)) {
			break;
		}
		el = el.parentElement;
	}
	return el;
}

if (!Element.prototype.matches) {
	Element.prototype.matches =
			Element.prototype.matchesSelector ||
			Element.prototype.mozMatchesSelector ||
			Element.prototype.msMatchesSelector ||
			Element.prototype.oMatchesSelector ||
			Element.prototype.webkitMatchesSelector ||
			function (s) {
				var matches = (this.document || this.ownerDocument).querySelectorAll(s),
						i = matches.length;
				while (--i >= 0 && matches.item(i) !== this);
				return i > -1;
			};
}

if (!Array.prototype.forEach) {
	Array.prototype.forEach = function (fn, scope) {
		for (var i = 0, len = this.length; i < len; ++i) {
			fn.call(scope, this[i], i, this);
		}
	}
}