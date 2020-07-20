// Discord widget JSON doesn't give the user's role
// Hence the need to trace it manually...
var DISCORD_USER_ADMIN = ['Lyrgard#1585'],
    DISCORD_USER_KNOWLEDGEABLE = ['Darwe#7148', 'Spuuky#1546', 'tmtl#5880', 'Kujo#6865', 'sic#9510'],
    DISCORD_USER_DEVS = ['Indigo#1164', 'biovenger#4295', 'Xist#5200'];

var tar_bgLandscape = '.ffbe_content--landscape',
    tar_bgLandItem  = '.landscape-bg';

/* Landscape Parallax Animation -------------------------------------------------------------------- */
var handleBackgroundAnimation = function() {
    var maxDeltaPx = 50;
    var layers = [
        /* .layer-1 do not move, so is not present */
        // Layer 2, moves not much
        {
            $element: $(tar_bgLandItem + '.bg-2'),
            scrollSpeedFactor: 0.15,
            mouseSpeedFactor: 0.02,
            translate: { x: 0, y: 0 },
            initialOffset: { top: null, left: null},
            size: { height: null, width: null}
        },

        // Layer 3, moves a little
        {
            $element: $(tar_bgLandItem + '.bg-3'),
            scrollSpeedFactor: 0.25,
            mouseSpeedFactor: 0.10,
            translate: { x: 0, y: 0 },
            initialOffset: { top: null, left: null},
            size: { height: null, width: null}
        },

        // Layer 4, moves the most
        {
            $element: $(tar_bgLandItem + '.bg-4'),
            scrollSpeedFactor: 0.35,
            mouseSpeedFactor: 0.30,
            translate: { x: 0, y: 0 },
            initialOffset: { top: null, left: null},
            size: { height: null, width: null}
        },
    ];

    var backgroundWidth = $(tar_bgLandscape).outerWidth(true);
    var backgroundHeight = $(tar_bgLandscape).outerHeight(true);

    // Bail! Background will be fixed
    if (backgroundWidth < 770) return;

    var layerId;
    var maxLayers = layers.length;
    var scrollTop = 0;
    var lastLayerVisibleYLimit = $(tar_bgLandscape).next().position().top - ($(tar_bgLandscape + ' .layer-border').outerHeight(true) / 2);

    var maxScrollPosition = layers[maxLayers-1].$element.position().top;

    /* Init style for layers element */
    for (layerId = 0; layerId < maxLayers ; layerId++) {
        layers[layerId].$element[0].setAttribute('style', 'transform: translate3d(0px, 0px, 0px)');
        layers[layerId].initialOffset = layers[layerId].$element.offset();
        layers[layerId].size.height = layers[layerId].$element.outerHeight(true);
        layers[layerId].size.width = layers[layerId].$element.outerWidth(true);
    }

    /* Function to animate position */
    var animatePos = function() {
        var newTransform;
        for (layerId = 0; layerId < maxLayers ; layerId++) {
            newTransform = 'translate3d(' + layers[layerId].translate.x + 'px, ' + layers[layerId].translate.y + 'px, 0px)';
            if (newTransform !== layers[layerId].$element[0].style.transform) {
                layers[layerId].$element[0].style.transform = newTransform;
            }
        }
    };

    /* Function to calculate position */
    var calculatePos = function() {
        var xPos, yPos, xPosStr, yPosStr, hasChanged = false;
        for (layerId = 0; layerId < maxLayers ; layerId++) {
            // Handle mouse position
            xPos = maxDeltaPx * (pageX - (backgroundWidth / 2)) / backgroundWidth * layers[layerId].mouseSpeedFactor;
            yPos = maxDeltaPx * (pageY - (backgroundHeight / 2)) / backgroundHeight * layers[layerId].mouseSpeedFactor;
            // Handle scroll position, only in Y
            yPos -= (scrollTop * layers[layerId].scrollSpeedFactor);
            // Update x/y pos if changed
            xPosStr = xPos.toFixed(2);
            yPosStr = yPos.toFixed(2)
            if (layers[layerId].translate.x !== xPosStr || layers[layerId].translate.y !== yPosStr) {
                layers[layerId].translate.x = xPosStr;
                layers[layerId].translate.y = yPosStr;
                hasChanged = true;
            }
            // Check for visible limit
            if (layerId === maxLayers - 1) {
                var bottomPos = layers[layerId].initialOffset.top + yPos + layers[layerId].size.height;
                if (bottomPos < lastLayerVisibleYLimit) {
                    hasChanged = false;
                }
            }
        }
        if (hasChanged) {
            window.requestAnimationFrame(animatePos);
        }
    };

    /* On mouse move, update mouse position */
    var pageX = 0, pageY = 0;
    $(tar_bgLandscape)[0].addEventListener('mousemove', $.throttle(25, function(e) {
        pageX = e.pageX;
        pageY = e.pageY;
        if (scrollTop < maxScrollPosition) {
            window.requestAnimationFrame(calculatePos);
        }
    }), false);

    /* On scroll, update scroll position */
    document.addEventListener('scroll', $.throttle(25, function(e) {
        scrollTop = window.pageYOffset || document.documentElement.scrollTop;
        if (scrollTop < maxScrollPosition) {
            window.requestAnimationFrame(calculatePos);
        }
    }), false);
};

// will be called by common.js at page load
function startPage() {
    handleBackgroundAnimation();

    $(tar_bgLandscape).on('click', '.landscape-icon a', function() {
        var url = $(this).data('internal-link');
        if (server != "GL") {
            url += "?server=" + server;
        }
        window.location.href = url;
    });

    $.get("https://api.github.com/repos/lyrgard/ffbeEquip/tags", function(tags) {
        var length = Math.min(5, tags.length);
        let improvements = 0;
        let features = 0;
        let dataUpdate = 0;
        Object.values(tags)
            .filter(tag => tag.name.length > 10 && tag.name.substr(tag.name.length - 10, 10).match(/\d\d\d\d_\d\d_\d\d/g))
            .sort((tag1, tag2) => tag2.name.substr(tag2.name.length - 10, 10).localeCompare(tag1.name.substr(tag1.name.length - 10, 10)))
            .forEach(tag => {
            var tag_class = '';
            var tag_icon = 'fa-tag';
            var tag_type = 'Update';
            if (tag.name.startsWith("IMPROVEMENT_")) {
                tag_icon = "fa-wrench";
                tag_type = 'Improvement';
                tag_class = 'improvement';
                improvements++;
                if (improvements > 4) return;
            } else if (tag.name.startsWith("FEATURE_")) {
                tag_icon = "fa-flash";
                tag_type = 'New feature';
                tag_class = 'feature';
                features++;
                if (features > 4) return;
            } else if (tag.name.startsWith("UPDATE_DATA")) {
                tag_icon = "fa-book";
                tag_type = 'Data update';
                tag_class = 'dataUpdate';
                dataUpdate++;
                if (dataUpdate > 4) return;
            }
            var html  = '<li class="list-group-item d-flex align-items-center tagline '+tag_class+' '+tag.commit.sha+'">';
                html += '  <span class="badge badge-ffbe badge-primary"><span class="fas '+tag_icon+' fa-fw mr-1"></span>'+tag_type+'</span>';
                html += "  <p class='mx-2 my-0 text-muted text-sm'><span class='tagauthor'></span> <span class='tagdate'></span></p>";
                html += "  <span class='ml-auto tagdesc'></span>";
                html += '</li>';

            $('#panel-github').append(html);

            $.get(tag.commit.url, function(commit) {
                var $tagline = $('#panel-github .'+commit.sha);
                var tagdate = new Date(commit.commit.author.date);
                $tagline.find('.tagdate').html("on " + tagdate.toLocaleDateString("en-US", {weekday:'long', year:'numeric', month:'long', day:'numeric'}));
                $tagline.find('.tagauthor').html("by " + ucFirst(commit.commit.author.name));
                $tagline.find('.tagdesc').html(commit.commit.message.replace(/(?:\r\n|\r|\n)+/g, '<br>'));
            }, 'json');
        })
    }, 'json').fail(function(jqXHR, textStatus, errorThrown ) {
        $('#panel-github').html("<li class='list-group-item'>Error</li>");
    });

    $.get("https://discordapp.com/api/guilds/389844892853075969/widget.json", function(widget) {
        var adminsNb = 0, userNb = 0, knowledgeableNb = 0, devNb = 0, idleNb = 0;
        for (var id = 0; id < widget.members.length; id++) {
            var member = widget.members[id];
            if (member.status === 'online') {
                var memberName = member.username+'#'+member.discriminator;
                if (DISCORD_USER_ADMIN.includes(memberName)) {
                    adminsNb++;
                } else if (DISCORD_USER_KNOWLEDGEABLE.includes(memberName)) {
                    knowledgeableNb++;
                } else if (DISCORD_USER_DEVS.includes(memberName)) {
                    devNb++;
                } else {
                    userNb++;
                }
            } else {
                idleNb++;
            }
        }
        var html = '';

        if (adminsNb > 0) {
            html += "<li class='list-group-item d-flex align-items-center discord-admin'>";
            html += "  <span class='badge badge-ffbe badge-success mr-2'><span class='fas fa-crown fa-fw'></span></span>";
            html +=    adminsNb + " admin" + (adminsNb>1?'s':'');
            html += "</li>";
        }
        if (knowledgeableNb > 0) {
            html += "<li class='list-group-item d-flex align-items-center discord-knowledgeable'>";
            html += "  <span class='badge badge-ffbe badge-info mr-2'><span class='fas fa-book fa-fw'></span></span>";
            html +=    knowledgeableNb + " knowledgable user" + (knowledgeableNb>1?'s':'');
            html += "</li>";
        }
        if (devNb > 0) {
            html += "<li class='list-group-item d-flex align-items-center discord-developer'>";
            html += "  <span class='badge badge-ffbe badge-primary mr-2'><span class='fas fa-tools fa-fw'></span></span>";
            html +=    devNb + " developer" + (devNb>1?'s':'');
            html += "</li>";
        }

        html += "<li class='list-group-item d-flex align-items-center discord-connected'>";
        html += "  <span class='badge badge-ffbe badge-primary mr-2'><span class='fas fa-user fa-fw'></span></span>";
        html +=    userNb + " user" + (userNb>1?'s':'');
        html += "  <span class='discord-idle ml-auto text-muted'>(and " + idleNb + " idle)</span>";
        html += "</li>";
        $('#panel-discord').html(html);
    }, 'json').fail(function(jqXHR, textStatus, errorThrown ) {
        $('#panel-discord').html("<li class='list-group-item'>Error</li>");
    });
}

function inventoryLoaded() {
}

function notLoaded() {
}

/*
 * The old start page was encyclopedia (named index.html)
 *
 * To avoid breaking old link with search options
 * we redirect the user to the encyclopedia page if a hash is found
 *
 */
if (window.location.hash != '') {
    window.location.href = '/encyclopedia.html' + window.location.hash;
}
