// 从 Python 后端 /api/content 获取最新内容并渲染
function renderFooter(el, footer) {
    if (!el || !footer) return;
    var parts = [];
    var text = (footer.text || '').trim();
    var beianNo = (footer.beianNo || '').trim();
    var beianUrl = (footer.beianUrl || '').trim();
    if (text) parts.push(text);
    if (beianNo) {
        parts.push('<a href="' + (beianUrl || '#') + '">' + beianNo + '</a>');
    }
    if (parts.length) {
        el.style.display = '';
        el.innerHTML = parts.join(' | ');
    } else {
        el.innerHTML = '';
        el.style.display = 'none';
    }
}

function renderContent(data) {
    if (!data) return;
    document.title = data.site.title;
    var metaDesc = document.querySelector('meta[name="description"]');
    if (metaDesc) metaDesc.setAttribute('content', data.site.description);

    if (data.site.favicon) {
        var favicon = document.querySelector('link[rel="icon"]');
        if (favicon) favicon.href = data.site.favicon;
    }

    var nameEl = document.querySelector('.welcome .gradientText');
    if (nameEl) nameEl.textContent = data.profile.name;
    var roleEl = document.querySelector('.description .purpleText');
    if (roleEl) roleEl.textContent = data.profile.role;
    var locSpan = document.querySelector('.left-des [data-content="location"]');
    if (locSpan) locSpan.textContent = data.profile.location;
    var schoolSpan = document.querySelector('.left-des [data-content="school"]');
    if (schoolSpan) schoolSpan.textContent = data.profile.school;

    if (data.profile.avatar) {
        var avatars = document.querySelectorAll('.logo, .index-logo');
        avatars.forEach(function(el) { el.style.backgroundImage = 'url(' + data.profile.avatar + ')'; });
    }
    if (data.profile.avatarFrame) {
        var frames = document.querySelectorAll('.logo img, .index-logo img');
        frames.forEach(function(el) { el.src = data.profile.avatarFrame; });
    }

    var tagContainer = document.querySelector('.left-tag');
    if (tagContainer) {
        tagContainer.innerHTML = data.tags.map(function (t) { return '<div class="left-tag-item">' + t + '</div>'; }).join('');
    }

    var line = document.getElementById('line');
    if (line) {
        line.innerHTML = data.timeline.slice().reverse().map(function (item) {
            return '<li><div class="focus"></div><div>' + item.text + '</div><div>' + item.date + '</div></li>';
        }).join('');
    }

    var sitesList = document.getElementById('sites-list');
    if (sitesList) {
        sitesList.innerHTML = data.sites.map(function (s) {
            return '<a class="projectItem a" target="_blank" href="' + s.url + '"><div class="projectItemLeft"><h1>' + s.title + '</h1><p>' + s.desc + '</p></div><div class="projectItemRight"><img src="' + s.img + '" alt=""></div></a>';
        }).join('');
    }
    var projectsList = document.getElementById('projects-list');
    if (projectsList) {
        projectsList.innerHTML = data.projects.map(function (p) {
            return '<a class="projectItem b" target="_blank" href="' + p.url + '"><div class="projectItemLeft"><h1>' + p.title + '</h1><p>' + p.desc + '</p></div><div class="projectItemRight"><img src="' + p.img + '" alt=""></div></a>';
        }).join('');
    }

    var gh = document.querySelector('.iconItem[data-link="github"]');
    if (gh && data.links.github) gh.href = data.links.github;
    var mail = document.querySelector('.iconItem[data-link="mail"]');
    if (mail && data.links.mail) mail.href = data.links.mail;
    var sponsor = document.querySelector('.iconItem[data-link="sponsor"]');
    if (sponsor && data.links.sponsorImg) sponsor.dataset.img = data.links.sponsorImg;
    var qq = document.querySelector('.iconItem[data-link="qq"]');
    if (qq && data.links.qqImg) qq.dataset.img = data.links.qqImg;

    var footer = document.querySelector('footer');
    if (footer) renderFooter(footer, data.footer);
}

document.addEventListener('contextmenu', function (event) {
    event.preventDefault();
});

function handlePress(event) {
    this.classList.add('pressed');
}

function handleRelease(event) {
    this.classList.remove('pressed');
}

function handleCancel(event) {
    this.classList.remove('pressed');
}

var buttons = document.querySelectorAll('.projectItem');
buttons.forEach(function (button) {
    button.addEventListener('mousedown', handlePress);
    button.addEventListener('mouseup', handleRelease);
    button.addEventListener('mouseleave', handleCancel);
    button.addEventListener('touchstart', handlePress);
    button.addEventListener('touchend', handleRelease);
    button.addEventListener('touchcancel', handleCancel);
});

function toggleClass(selector, className) {
    var elements = document.querySelectorAll(selector);
    elements.forEach(function (element) {
        element.classList.toggle(className);
    });
}

function pop(imageURL) {
    var tcMainElement = document.querySelector(".tc-img");
    if (imageURL) {
        tcMainElement.src = imageURL;
    }
    toggleClass(".tc-main", "active");
    toggleClass(".tc", "active");
}

var tc = document.getElementsByClassName('tc');
var tc_main = document.getElementsByClassName('tc-main');
tc[0].addEventListener('click', function (event) {
    pop();
});
tc_main[0].addEventListener('click', function (event) {
    event.stopPropagation();
});



function setCookie(name, value, days) {
    var expires = "";
    if (days) {
        var date = new Date();
        date.setTime(date.getTime() + days * 24 * 60 * 60 * 1000);
        expires = "; expires=" + date.toUTCString();
    }
    document.cookie = name + "=" + value + expires + "; path=/";
}

function getCookie(name) {
    var nameEQ = name + "=";
    var cookies = document.cookie.split(';');
    for (var i = 0; i < cookies.length; i++) {
        var cookie = cookies[i];
        while (cookie.charAt(0) == ' ') {
            cookie = cookie.substring(1, cookie.length);
        }
        if (cookie.indexOf(nameEQ) == 0) {
            return cookie.substring(nameEQ.length, cookie.length);
        }
    }
    return null;
}















document.addEventListener('DOMContentLoaded', function () {
    // 从 /api/content 拉取站点 JSON（存于服务端数据库）
    function applyContent(data) {
        renderContent(data);
        var buttons = document.querySelectorAll('.projectItem');
        buttons.forEach(function (button) {
            button.addEventListener('mousedown', handlePress);
            button.addEventListener('mouseup', handleRelease);
            button.addEventListener('mouseleave', handleCancel);
            button.addEventListener('touchstart', handlePress);
            button.addEventListener('touchend', handleRelease);
            button.addEventListener('touchcancel', handleCancel);
        });
    }
    fetch('./api/content', { method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify({action: 'get'}) })
        .then(function (r) { return r.json(); })
        .then(function (data) {
            applyContent(data);
        })
        .catch(function () { console.warn('获取内容失败'); });




    var html = document.querySelector('html');
    var themeState = getCookie("themeState") || "Light";
    var tanChiShe = document.getElementById("tanChiShe");






    function changeTheme(theme) {
        tanChiShe.src = "./static/svg/snake-" + theme + ".svg";
        html.dataset.theme = theme;
        setCookie("themeState", theme, 365);
        themeState = theme;
    }







    var Checkbox = document.getElementById('myonoffswitch')
    Checkbox.addEventListener('change', function () {
        if (themeState == "Dark") {
            changeTheme("Light");
        } else if (themeState == "Light") {
            changeTheme("Dark");
        } else {
            changeTheme("Dark");
        }
    });



    if (themeState == "Dark") {
        Checkbox.checked = false;
    }

    changeTheme(themeState);

















   

    var fpsElement = document.createElement('div');
    fpsElement.id = 'fps';
    fpsElement.style.zIndex = '10000';
    fpsElement.style.position = 'fixed';
    fpsElement.style.left = '0';
    document.body.insertBefore(fpsElement, document.body.firstChild);

    var showFPS = (function () {
        var requestAnimationFrame = window.requestAnimationFrame ||
            window.webkitRequestAnimationFrame ||
            window.mozRequestAnimationFrame ||
            window.oRequestAnimationFrame ||
            window.msRequestAnimationFrame ||
            function (callback) {
                window.setTimeout(callback, 1000 / 60);
            };

        var fps = 0,
            last = Date.now(),
            offset, step, appendFps;

        step = function () {
            offset = Date.now() - last;
            fps += 1;

            if (offset >= 1000) {
                last += offset;
                appendFps(fps);
                fps = 0;
            }

            requestAnimationFrame(step);
        };

        appendFps = function (fpsValue) {
            fpsElement.textContent = 'FPS: ' + fpsValue;
        };

        step();
    })();
    
 
    
    
    
});




var pageLoading = document.querySelector("#page-loading");
window.addEventListener('load', function() {
    setTimeout(function () {
        pageLoading.style.opacity = '0';
    }, 100);
});

