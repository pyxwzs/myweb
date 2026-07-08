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
        el.innerHTML = parts.join(' | ');
    } else {
        el.innerHTML = '';
    }
}

function escHtml(s) {
    return String(s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;');
}

function buildSiteItemHtml(s) {
    var qrcode = (s.qrcode || '').trim();
    var url = (s.url || '').trim();
    var inner = '<div class="projectItemLeft"><h1>' + escHtml(s.title) + '</h1><p>' + escHtml(s.desc) + '</p></div>'
        + '<div class="projectItemRight"><img src="' + escHtml(s.img) + '" alt=""></div>';
    if (qrcode) {
        inner += '<span class="site-mp-btn" data-qrcode="' + escHtml(qrcode) + '" title="查看小程序码">'
            + '<svg class="site-mp-icon" viewBox="0 0 1024 1024" xmlns="http://www.w3.org/2000/svg">'
            + '<path d="M626.176 279.552c74.24 0 134.4 55.808 134.4 124.928 0 69.12-60.16 124.928-134.4 124.928-74.24 0-134.4-55.808-134.4-124.928 0-69.12 60.16-124.928 134.4-124.928zM397.824 279.552c74.24 0 134.4 55.808 134.4 124.928 0 69.12-60.16 124.928-134.4 124.928-74.24 0-134.4-55.808-134.4-124.928 0-69.12 60.16-124.928 134.4-124.928zM512 64C264.576 64 64 238.336 64 456.704c0 168.448 98.816 315.392 243.712 384.512L256 896l156.672-83.968c31.232 8.704 64.512 13.312 99.328 13.312 247.424 0 448-174.336 448-392.704C960 238.336 759.424 64 512 64z"/>'
            + '</svg></span>';
    }
    if (url) {
        return '<a class="projectItem a site-item" target="_blank" href="' + escHtml(url) + '">' + inner + '</a>';
    }
    if (qrcode) {
        return '<div class="projectItem a site-item site-item--mp-only">' + inner + '</div>';
    }
    return '<div class="projectItem a site-item">' + inner + '</div>';
}

function bindSiteMpButtons(container) {
    if (!container) return;
    container.querySelectorAll('.site-mp-btn').forEach(function (btn) {
        btn.addEventListener('click', function (e) {
            e.preventDefault();
            e.stopPropagation();
            pop(btn.getAttribute('data-qrcode'));
        });
    });
    container.querySelectorAll('.site-item--mp-only').forEach(function (card) {
        card.style.cursor = 'pointer';
        card.addEventListener('click', function () {
            var btn = card.querySelector('.site-mp-btn');
            if (btn) pop(btn.getAttribute('data-qrcode'));
        });
    });
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
        tagContainer.innerHTML = data.tags.map(function (t) { return '<div class="left-tag-item">' + escHtml(t) + '</div>'; }).join('');
    }

    var mobileTags = document.getElementById('mobile-tags');
    if (mobileTags) {
        mobileTags.innerHTML = data.tags.map(function (t) { return '<div class="left-tag-item">' + escHtml(t) + '</div>'; }).join('');
    }
    var mobileLoc = document.getElementById('mobile-location');
    var mobileSchool = document.getElementById('mobile-school');
    var mobileBrief = document.querySelector('.mobile-brief');
    if (mobileLoc) mobileLoc.textContent = data.profile.location || '';
    if (mobileSchool) mobileSchool.textContent = data.profile.school || '';
    if (mobileBrief) {
        var hasBrief = (data.profile.location || data.profile.school || (data.tags && data.tags.length));
        mobileBrief.style.display = hasBrief ? '' : 'none';
    }
    if (mobileLoc) mobileLoc.style.display = data.profile.location ? '' : 'none';
    if (mobileSchool) mobileSchool.style.display = data.profile.school ? '' : 'none';

    var line = document.getElementById('line');
    if (line) {
        line.innerHTML = data.timeline.slice().reverse().map(function (item) {
            return '<li><div class="focus"></div><div>' + item.text + '</div><div>' + item.date + '</div></li>';
        }).join('');
    }

    var sitesList = document.getElementById('sites-list');
    if (sitesList) {
        sitesList.innerHTML = data.sites.map(buildSiteItemHtml).join('');
        bindSiteMpButtons(sitesList);
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

