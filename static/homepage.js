
var DISCORD_USER_ADMIN = ['Lyrgard#1585'];
var DISCORD_USER_KNOWLEDGEABLE = ['Darwe#7148', 'Spuuky#1546', 'tmtl#5880', 'Kujo#6865'];
var DISCORD_USER_DEVS = ['Indigo#1164'];


var handleBackgroundAnimation = function() {
    
    var maxDeltaPx = 50;

    var layers = [
        /* .layer-1 do not move, so is not present */

        // Layer 2, moves not much
        {
            $element: $('.mainmenu .layer-2'),
            scrollSpeedFactor: 0.15,
            mouseSpeedFactor: 0.02,
            translate: { x: 0, y: 0 },
            initialOffset: { top: null, left: null},
            size: { height: null, width: null}
        },

        // Layer 3, moves a little
        {
            $element: $('.mainmenu .layer-3'),
            scrollSpeedFactor: 0.25,
            mouseSpeedFactor: 0.10,
            translate: { x: 0, y: 0 },
            initialOffset: { top: null, left: null},
            size: { height: null, width: null}
        },

        // Layer 4, moves the most
        {
            $element: $('.mainmenu .layer-4'),
            scrollSpeedFactor: 0.35,
            mouseSpeedFactor: 0.30,
            translate: { x: 0, y: 0 },
            initialOffset: { top: null, left: null},
            size: { height: null, width: null}
        },
    ];
    var backgroundWidth = $('.mainmenu').outerWidth(true);
    var backgroundHeight = $('.mainmenu').outerHeight(true);

    // Bail! Background will be fixed
    if (backgroundWidth < 770) return;

    var layerId;
    var maxLayers = layers.length;
    var scrollTop = 0;

    var lastLayerVisibleYLimit = $('.mainmenu').next().position().top - ($('.mainmenu .layer-border').outerHeight(true) / 2);

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
    $('.mainmenu')[0].addEventListener('mousemove', $.throttle(25, function(e) {
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

    $('.mainmenu').on('click', '.mainmenu-title,.mainmenu-illustration', function() {
        var url = $(this).parent().attr('data-internal-link');
        window.location.href = url;
    });

    $.get("https://api.github.com/repos/lyrgard/ffbeEquip/tags", function(tags) {
        var length = Math.min(5, tags.length);
        for (var id = 0; id < length; id++) {
            var tag = tags[id];
            var tag_class = '';
            var tag_icon = 'glyphicon-tag';
            var tag_type = 'Update';
            if (tag.name.startsWith("IMPROVEMENT_")) {
                tag_icon = "glyphicon-wrench";
                tag_type = 'Improvement';
                tag_class = 'improvement';
            } else if (tag.name.startsWith("FEATURE_")) {
                tag_icon = "glyphicon-flash";
                tag_type = 'New feature';
                tag_class = 'feature';
            }
            var html = '<div class="hidden tagline '+tag_class+' '+tag.commit.sha+'">';
            html += "<div>";
            html += "<span class='tagtype'><span class='glyphicon "+tag_icon+"'></span>"+tag_type+"</span>";
            html += "<span class='tagauthor'></span>";
            html += "<span class='tagdate'></span>";
            html += "</div>";
            html += "<div class='tagdesc'></div>";
            html += '</div>';
            $('#panel-github .panel-body').append(html);
            $.get(tag.commit.url, function(commit) {
                var $tagline = $('#panel-github .panel-body .'+commit.sha);
                var tagdate = new Date(commit.commit.author.date);
                $tagline.find('.tagdate').html("on " + tagdate.toLocaleDateString("en-US", {weekday:'long', year:'numeric', month:'long', day:'numeric'}));
                $tagline.find('.tagauthor').html("by " + ucFirst(commit.commit.author.name));
                $tagline.find('.tagdesc').html(commit.commit.message.replace(/(?:\r\n|\r|\n)+/g, '<br>'));
                $tagline.removeClass('hidden');
            }, 'json');
        }
    }, 'json').fail(function(jqXHR, textStatus, errorThrown ) {
        $('#panel-github .panel-body').html("Error");
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
            html += "<span class='discord-admin'>";
            html += "<span class='glyphicon glyphicon-king'></span>";
            html += adminsNb + " admin" + (adminsNb>1?'s':'');
            html += "</span>";
        }
        if (knowledgeableNb > 0) {
            html += "<span class='discord-knowledgeable'>";
            html += "<span class='glyphicon glyphicon-education'></span>";
            html += knowledgeableNb + " knowledgable user" + (knowledgeableNb>1?'s':'');
            html += "</span>";
        }
        if (devNb > 0) {
            html += "<span class='discord-developer'>";
            html += "<span class='glyphicon glyphicon-cog'></span>";
            html += devNb + " developer" + (devNb>1?'s':'');
            html += "</span>";
        }
        html += "<span class='discord-connected'>";
        html += "<span class='glyphicon glyphicon-user'></span>";
        html += userNb + " user" + (userNb>1?'s':'');
        html += "</span>";
        html += "<span class='discord-idle'>(and " + idleNb + " idle)</span>";
        $('#panel-discord .panel-body').html(html);
    }, 'json').fail(function(jqXHR, textStatus, errorThrown ) {
        $('#panel-discord .panel-body').html("Error while loading list...");
    });
}
  
function inventoryLoaded() {
}

function notLoaded() {
}
