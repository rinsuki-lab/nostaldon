function $createPostElement(post: any) {
    const $post = $('<div>').addClass("ui-widget ui-widget-content ui-corner-all ui-mastodon-post")
    const $user = $('<a>').addClass("ui-mastodon-post-user").attr("href", post.account.url)
        .append($('<img>').attr("src", post.account.avatar_static).css("float", "left"))
        .append($('<span>').addClass("ui-mastodon-post-user-name").text(post.account.display_name))
        .append($('<span>').addClass("ui-mastodon-post-user-acct").text(" @" + post.account.acct))
    $post.append($user)
    $post.append($('<div>').html(post.content).addClass("ui-mastodon-post-content"))
    return $post
}

function openTimeline(hostname: string, name: string, local: boolean) {
    const $dialog = $('<div>').dialog({
        title: (local ? "LTL" : "FTL") + ": " + hostname,
        width: 360,
        height: 500,
    })
    const xhr = new XMLHttpRequest()
    const url = new URL("https://example.com/")
    url.protocol = "https:"
    url.hostname = hostname
    url.pathname = "/api/v1/timelines/" + name
    if (local) {
        url.search = "local=true"
    }
    xhr.onload = function(e) {
        $.each(JSON.parse(xhr.responseText), function(index, value) {
            $dialog.append($createPostElement(value))
        })
    }
    xhr.open("GET", url.href)
    xhr.send()
    try {
        url.protocol = "wss:"
        url.pathname = "/api/v1/streaming/"
        url.search = "stream=" + name
        if (local) {
            url.search += ":local"
        }
        const ws = new WebSocket(url.href)
        ws.onmessage = function (event) {
            const data = JSON.parse(event.data)
            if (data.event === "update") {
                $dialog.prepend($createPostElement(JSON.parse(data.payload)))
            }
        }
    } catch(e) {
        try {
            console.error(e)
        } catch (e) {
            // :P
        }
    }
}

function openEmbedPlayer(title: string, url: string) {
    $("<div>")
        .addClass("ui-dialog-player")
        .append($('<iframe>').attr("src", url))
        .dialog({
            width: 640, height: 360, title,
            close: function() {
                $(this).dialog("destroy")
            }
        })
}

$(function() {
    $("#mainmenu").menu()
    $("#open-local-timeline").click(function() {
        $('<div title="ローカルタイムラインを開く"><p>インスタンスのホストを入力してください。</p><p><input type="text" name="host" placeholder="mstdn.example.com" class="ui-widget ui-widget-content ui-corner-all ui-textinput"></p></div>').dialog({
            modal: true,
            width: 400,
            buttons: {
                "キャンセル": function() {
                    $(this).dialog("close")
                },
                "開く": function() {
                    openTimeline($(this).find("input[type=text]").val() as string, "public", true)
                    $(this).dialog("close")
                },
            }
        })
    })
    $("#open-fedi-timeline").click(function() {
        $('<div title="連合タイムラインを開く"><p>インスタンスのホストを入力してください。</p><p><input type="text" name="host" placeholder="mstdn.example.com" class="ui-widget ui-widget-content ui-corner-all ui-textinput"></p></div>').dialog({
            modal: true,
            width: 400,
            buttons: {
                "キャンセル": function() {
                    $(this).dialog("close")
                },
                "開く": function() {
                    openTimeline($(this).find("input[type=text]").val() as string, "public", false)
                    $(this).dialog("close")
                },
            }
        })
    })
    // openTimeline("social.mikutter.hachune.net", "public", false)
    // openTimeline("mstdn.rinsuki.net", "public", true)
    $(document).on("click", "a[target=_blank]", function(event) {
        const anchor = this as HTMLAnchorElement
        const url = new URL(anchor.href)
        if ((url.hostname === "www.nicovideo.jp" || url.hostname === "sp.nicovideo.jp") && url.pathname.slice(0, "/watch/".length) == "/watch/") {
            url.protocol = "https:"
            url.hostname = "embed.nicovideo.jp"
            openEmbedPlayer("ニコニコ動画", url.href)
            event.preventDefault()
            return
        }
        if (url.hostname === "nico.ms" && /^(sm|nm|so)?[0-9]+$/.test(url.pathname.slice(1))) {
            url.protocol = "https:"
            url.hostname = "embed.nicovideo.jp"
            url.pathname = "/watch" + url.pathname
            openEmbedPlayer("ニコニコ動画", url.href)
            event.preventDefault()
            return
        }
        if ((url.hostname === "www.youtube.com" || url.hostname === "m.youtube.com") && url.pathname === "/watch") {
            url.hostname = "www.youtube.com"
            url.pathname = "/embed/"
            const params = url.search.slice(1).split("&").map(a => a.split("="))
            for (const [key, val] of params) {
                if (key === "v") {
                    url.pathname += val
                    break
                }
            }
            openEmbedPlayer("YouTube", url.href)
            event.preventDefault()
            return
        }
        if (url.hostname === "youtu.be" && url.pathname.length > 2) {
            url.hostname = "www.youtube.com"
            url.pathname = "/embed" + url.pathname
            openEmbedPlayer("YouTube", url.href)
            event.preventDefault()
            return
        }
    })
})