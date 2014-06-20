var data;

$(function(){
    $(".toggler a").click(function() {
        var newText = $(this).data("toggle");
        $(this).data("toggle", $(this).text());
        $(this).text(newText);
        $(this).next().toggle();
        return false;
    });

    $("#add_team img").click(function() {
        var id = $(this).prev().val();
        if (id == "")
            alert("Musíš vyplnit ID týmu vole");
        else if (!isNumber(id))
            alert("Nevím cos to vyplnil kámo, ale id to není. ID je totiž číslo ...");
        else {
            addTeam(id);
        }
        return false;
    });

    $("#add_player img").click(function() {
        var id = $(this).prev().val();
        if (id == "")
            alert("Musíš vyplnit ID vole");
        else if (!isNumber(id))
            alert("Nevím cos to vyplnil kámo, ale id to není. ID je totiž číslo ...");
        else if (getPlayerName(id))
            alert("Kámo, tenhle týpek už v seznamu dávno je ;-)");
        else {
            addPlayer(id);
            $.removeCookie("last-team", { path: basePath});
        }
        return false;
    });

    $("#datas > select[name=hero]").change(function() {
        var val = $("option:selected", this).val();
        filterHeroStats(val);
    });

    var lastTeam = $.cookie("last-team");
    var lastPlayers = $.cookie("last-players");
    if (lastPlayers)
        lastPlayers = lastPlayers.split(".");
    if (lastTeam) {
        addTeam(lastTeam);
    } else if (lastPlayers && lastPlayers.length > 0) {
        $.each(lastPlayers, function(i, player) {
            addPlayer(player);
        });
    }
});

function clearPlayers() {
    //$("#team_info").hide();
    $("#team_info > *").hide();
    $("#team_info .name").html('');

    //$("#players_info").hide();
    $("#players_info > *").hide();
    $("#players_info > .list").empty();
}

function isNumber(n) {
    return !isNaN(parseFloat(n)) && isFinite(n);
}

function loadData() {
    var ids = getPlayerIds();

    $("#loader").show();
    $.getJSON($("#datas").data("href"), { players : ids.join(".") }, function(content) {
        data = content.data;
        onLoaded();
    });
}

function getPlayerIds() {
    var ids = [];
    $("#players_info > .list > tr").each(function() {
        ids.push($(this).data("id"));
    });

    return ids;
}

function onLoaded() {
    var heroes = getHeroes();

    var select = $("#datas > select[name=hero]");
    var sorted_keys = Object.keys(heroes).sort()
    $("option", select).remove();
    $("<option/>", { value : 'none' })
        .text("-- Vyber hrdinu pyčo")
        .appendTo(select);

    $.each(sorted_keys, function(key, value) {
        $("<option/>", { value : value } )
            .text(heroes[value])
            .appendTo(select);
    });

    $("#loader").hide();
    $("#datas").show();
}

function getHeroes() {
    if (!data)
        return [];

    var arr = [];
    for (var key in Object.keys(data)) {
        $.each(data[Object.keys(data)[key]], function(key, value) {
            arr[value.id] = value.name;
        });
    }

    return arr;}

function loadHeroesStats(hero_key) {
    var players = new Object();
    $.each(data, function(id, heroes) {
        heroes.forEach(function(value) {
            if (value.id == hero_key) {
                players[id] = value;
                return false;
            } else
                return true;
        });
    });

    return players;
}

function filterHeroStats(hero_key) {
    var stats = loadHeroesStats(hero_key);
    var table_body = $("#hero_comparision > tbody");
    table_body.empty();
    if (hero_key != "none") {
        $.each(stats, function(key, data) {
            ;
            $("<tr/>")
                .append(
                    $("<td/>")
                        .text(getPlayerName(key))
                )
                .append(
                    $("<td/>")
                        .text((data.played / getTotalGames(key) * 100).toFixed(2) + "%")
                )
                .append(
                    $("<td/>")
                        .text(data.played)
                )
                .append(
                    $("<td/>")
                        .text(parseFloat(data.win_rate * 100).toFixed(2) + "%")
                )
                .appendTo(table_body);
        });
    }
}

function getPlayerName(id) {
    var ret = null;
    $("#players_info > .list > tr").each(function() {
        if ($(this).data('id') == id) {
            ret = $("a", this).text();
            return false;
        } else
            return true;
    });

    return ret;
}

function addPlayer(id) {
    var obj = $("#add_player img");
    var url = obj.parent().parent().data("href");
    var a = obj.parent().prev();
    if ($("#team_info .name").is(":visible"))
        clearPlayers();

    $("#players_info > .loading").show();
    $("#players_info > .empty").hide();
    $("#players_info .on_active").hide();
    $.getJSON(url, { player: id }, function(data) {

        $("#players_info > .loading").hide();
        addPlayerRow(data);

        $("#players_info .on_active").show();
        $("#players_info > .empty").hide();

        if (obj.parent().is(":visible"))
            a.click();

        $.cookie("last-players", getPlayerIds().join("."), { expires: 30, path: basePath});

        loadData();
    });
}

function addTeam(id) {
    var obj = $("#add_team img");
    var url = obj.parent().parent().data("href");
    var a = obj.parent().prev();
    clearPlayers();
    $("#players_info > .loading").show();
    $("#players_info .on_active").hide();
    $("#players_info > .empty").hide();
    $("#team_info > .loading").show();
    $("#team_info .on_active").hide();

    $.getJSON(url, { team: id }, function(data) {
        $("#team_info .name").attr("href", "http://dotabuff.com/teams/" + id).text(data.name);
        $("#team_info .icon").attr("src", data.icon);
        $("#team_info .on_active").show();
        $("#players_info > .loading").hide();
        $("#team_info > .loading").hide();

        $.each(data.players, function(key, value) {
            addPlayerRow(value);
        });

        $("#players_info .on_active").show();

        if (obj.parent().is(":visible"))
            a.click();

        $.cookie("last-team", id, { expires: 30, path: basePath});

        loadData();
    });
}

function addPlayerRow(info) {
    $("<tr/>", { 'data-id' : info.id })
        .append(
            $("<img/>", { src : info.icon })
        )
        .append(
            $("<a/>", { href : "http://dotabuff.com/players/" + info.id })
                .text(info.name)
        )
        .appendTo("#players_info > .list");
}

function getTotalGames(player) {
    var count = 0;
    $.each(data[player], function(key, val) {
        count += parseInt(val.played);
    });

    return count;
}