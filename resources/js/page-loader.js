var spinner;
var shouldDisplayLoadingSpinner = false;

function shouldSpin() {
  return shouldDisplayLoadingSpinner;
}

function showLoadingSpinner(display) {
  shouldDisplayLoadingSpinner = true;
  display.style.opacity = 1;
  display.innerHTML = '<span>Loading</span><div id="loading-spinner">&#9784</div><span id="loading-percent">0 %</span>';
  spinner = setTimeout(
    function(){
      if(!shouldSpin()){
        return;
      }
      var loadingSpinner = document.getElementById('loading-spinner');
      loadingSpinner.style.transition = "all 2s";
      spinLoadingSpinner(true);
    }, 100);
}

function hideLoadingSpinner(display) {
  if(!display.style) {
    return;
  }
  
  shouldDisplayLoadingSpinner = false;
  clearTimeout(spinner);
  display.style.opacity = 0;
  setTimeout(function(){display.innerHTML = ""; window.scrollTo(0,0);}, 500);
}

function spinLoadingSpinner(spinForward){
  var loadingSpinner = document.getElementById('loading-spinner');
  if(loadingSpinner && shouldSpin()){
    var spinDirection = (spinForward?"rotate(360deg)":"rotate(-360deg)");
    loadingSpinner.style.transform = spinDirection;
    setTimeout(
      function(){
        spinLoadingSpinner(!spinForward);
      }, 2000);
   }
}

function updateProgress(e) {
  var percentComplete = (e.loaded/e.total) * 100;
  updateLoadStatus(percentComplete + " %");
}

function transferComplete(e) {
  updateLoadStatus('Displaying content...');
}

function transferFailed(e) {
  updateLoadStatus('Connection failed. Try again.');
}

function updateLoadStatus(message) {
  var percentDisplay = document.getElementById('loading-percent');
  if(percentDisplay) {
    percentDisplay.style.opacity = 0;
    setTimeout(function(){
      percentDisplay.style.opacity = 1;
      percentDisplay.innerHTML = message;
    }, 500);
  }
}

function transferCanceled(e) {
  updateLoadStatus('Loading cancelled.');
}

function initSpinner(display) {
  if(display !== document) {
    if(display.innerHTML !== ''){
     display.style.transition = "all 0.5s ease-in-out";
     shouldDisplayLoadingSpinner = true;
     setTimeout(
      function(){
        display.style.opacity = "0";
        setTimeout(
          function(){
            if(shouldSpin())
            showLoadingSpinner(display);
          }, 500);
      }, 100);
    }
  }
}

function getPageAndDisplay(page, display, setHistory, locationUrl, scrollToTop) {
  if(!display || !page) {
    return;
  }
  
  initSpinner(display);
  
  var xhttp = new XMLHttpRequest();
  xhttp.addEventListener('progress', updateProgress);
  xhttp.addEventListener('load', transferComplete);
  xhttp.addEventListener('error', transferFailed);
  xhttp.addEventListener('abort', transferCanceled);
  
  var mySpinner = spinner;
  xhttp.onreadystatechange = function () {
    if(this.readyState == 4){
      if(this.status == 200) {
        hideLoadingSpinner(display, mySpinner, scrollToTop);
        displayNewContent(display, this.responseText);
        updateHistory(locationUrl, page, setHistory);
        underlineNavItem();
      } else {
        displayErrorMessage(display, this.statusText);
      }
    }
  };
  
  xhttp.open('GET', page + '?' + (new Date()).getTime(), true);
  setTimeout(function(){xhttp.send();}, 200);
}

function displayErrorMessage(display, errorMessage) {
  var finalMessage = 'Failed to load. Please try again. ' + errorMessage;
  if(display === document) {
    display.write(finalMessage);
  } else {
    display.style.opacity = 0;
    setTimeout(function() {
      display.innerHTML = finalMessage;
      display.style.opacity = 1;
    }, 500);
  }
}

function displayNewContent(display, newContent) {
  if(display === document) {
    display.documentElement.style.opacity = 0;
    display.documentElement.innerHTML = newContent;
    setTimeout(function(){
      var scripts = document.scripts;
      for(var i = 0; i < scripts.length; i++) {
        var innerscript = scripts[i];
        eval(innerscript.innerHTML);
      }
      display.documentElement.style.opacity = 1;
    }, 600);
    return;
  }
  setTimeout(function() {
    display.innerHTML = newContent;
    display.style.opacity = "1";
    var scripts = display.getElementsByTagName('script');
    for(var i = 0; i < scripts.length; i++) {
      var innerscript = scripts[i];
      eval(innerscript.innerHTML);
    }
  }, 500);
}

function updateHistory(locationUrl, page, setHistory) {
  if(window.history && setHistory) {
    if(window.history.state != page) {
      var newLocation = locationUrl !== undefined? locationUrl : page;
      window.history.pushState(page, '', newLocation);
    }
  }
}

function underlineNavItem() {
  var mainNav = document.getElementById('main-nav');
  if(mainNav){
    var currentPath = window.location.pathname;
    var mainNavLinks = mainNav.getElementsByTagName('a');
    for(var i = 0; i < mainNavLinks.length; i++) {
      var hrefAtr = mainNavLinks[i].getAttribute('href');
      if( currentPath === '/' && hrefAtr === '/') {
        mainNavLinks[i].style.textDecoration = 'underline';
      } else if(hrefAtr !== '/' && currentPath.indexOf(hrefAtr) === 0) {
        mainNavLinks[i].style.textDecoration = 'underline';
      } else {
        mainNavLinks[i].style.textDecoration = 'none';
      }
    }
  }
}

function loadLatestBlogEntry(blogEntry) {
  var latestBlogDisplay = document.getElementById('latest-blog-entry');
  getPageAndDisplay('blog/blog-entry-' + blogEntry + '.html', latestBlogDisplay, false);
}

function loadBlogEntry(blogEntry) {
  var mainContent = document.getElementById('main-main');
  getPageAndDisplay('blog/blog-entry-' + blogEntry + '.html', mainContent, true);
  return false; // to consume anchor default link
}

function loadPage(page, setHistory, locationUrl) {
  if(setHistory === undefined) {
    setHistory = true;
  }
  var mainContent = document.getElementById('main-main');
  getPageAndDisplay(page, mainContent, setHistory, locationUrl);
  return false; // to consume anchor default link
}

function reloadPageInIndex() {
  getPageAndDisplay("/index.html", document, false);
}

function checkDirectNavigation(historyEntry) {
  var mainContent = document.getElementById("main-main");
  if(!mainContent) {
    if(window.history && window.history.state !== historyEntry) {
      window.history.pushState(historyEntry, '', '');
    }
    setTimeout(reloadPageInIndex, 100);
    window.stop();
  }
}
