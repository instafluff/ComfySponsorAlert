const plushApiUrl = "https://api.pixelplush.dev/v1"; //"http://localhost:3000/v1";
let gameTitle = "Comfy Sponsors Alerts";
let gameTheme = {};
let gameOptions = {};
let catalog = {};
let assetPath = "";
let pingInterval = null;
const NumFrames = 10;
let gameVolume = 0.5;
//
// const socket = new ReconnectingWebSocket( "wss://api.pixelplush.dev" );
//
// socket.addEventListener( "open", function ( event ) {
//     // socket.send('Hello Server!');
//     if( pingInterval ) {
//         clearInterval( pingInterval );
//     }
//     pingInterval = setInterval( () => {
//         socket.send( JSON.stringify({
//             type: "ping"
//         }));
//     }, 60000 * 5 ); // Ping every 5 mins
// });
//
// // Listen for messages
// socket.addEventListener( "message", function ( event ) {
//     let data = JSON.parse( event.data );
//     if( data.type === "pong" ) {
//         return;
//     }
//     // console.log( data );
//     switch( data.data.type ) {
//     case "item":
//     case "coupon-item":
//         showItemAlert( data.data.item, data.data.account.displayName );
//         break;
//     case "coins":
//         showCoinAlert( data.data.amount, data.data.account.displayName );
//         break;
//     default:
//         console.log( data );
//         break;
//     }
// });

function setupGame( title, theme, options ) {
    gameTitle = title;
    gameTheme = theme;
    gameOptions = options;

    assetPath = gameTheme.path || "";

    gameVolume = gameOptions.volume === undefined || gameOptions.volume === null ? 0.5 : parseInt( gameOptions.volume ) / 100;
}
window.setupGame = setupGame;

window.WebFontConfig = {
    google: {
        families: [ "Bubblegum Sans" ]
    },
    active() {
        CreateGame();
    },
};

/* eslint-disable */
// include the web-font loader script
(function() {
    const wf = document.createElement('script');
    wf.src = `${document.location.protocol === 'https:' ? 'https' : 'http'
    }://ajax.googleapis.com/ajax/libs/webfont/1/webfont.js`;
    wf.type = 'text/javascript';
    wf.async = 'true';
    const s = document.getElementsByTagName('script')[0];
    s.parentNode.insertBefore(wf, s);
}());
/* eslint-enabled */

function Init() {
    // Add Initialization Here
    // PIXI.settings.SCALE_MODE = PIXI.SCALE_MODES.NEAREST;

    Unicorn.Load( "alert_bg", `web/alert5.png` );

	// showComfyAlert( "instafluff" );
}

let alertQueue = []; // TODO: Add alert queue
let alertCounter = 0;
const alertTime = 5.0;
function showComfyAlert( name ) {
    alertCounter++;

    const x = 0, y = -400;
    const alertId = alertCounter;
    let alertBG = Unicorn.AddBacklay( "alert_" + alertId, "alert_bg", x, y, {
        // scale: { x: 3, y: 3 }
    } );

    let alertName = Unicorn.AddText( "alertname_" + alertId, name, x + 200, y + 200, {
        fontFamily: 'Bubblegum Sans',
        fontSize: 36,
        // fontWeight: 'bold',
        fill: "#f95f5d",
        lineJoin: "round",
        // stroke: "#ff6666",
        // strokeThickness: 6,
    } );
    let alertText = Unicorn.AddText( "alerttext_" + alertId, " became a Comfy Sponsor! WAA!!", x + 210 + alertName.width, y + 200, {
        fontFamily: 'Bubblegum Sans',
        fontSize: 36,
        // fontWeight: 'bold',
        fill: "#663931",
        lineJoin: "round",
    } );

    // Center the text
    const alertWidth = 656;// - 100;
    let textWidth = alertName.width + alertText.width + 10;
    alertName.position.x = x + ( alertWidth - textWidth ) / 2;
    alertText.position.x = alertName.position.x + 10 + alertName.width;
	//
    alertQueue.push( {
        type: "item",
        elements: [ alertBG, alertName, alertText ],
        yOffsets: [ 0, 200, 200 ],
        time: alertTime,
        cleanup: () => {
            Unicorn.RemoveBacklay( "alert_" + alertId );
            Unicorn.RemoveText( "alertname_" + alertId );
            Unicorn.RemoveText( "alerttext_" + alertId );
        }
    });

}

function Update( timestamp, timeDiffInMs ) {
    const timeDiff = timeDiffInMs / 1000;

    if( alertQueue.length > 0 ) {
        // Animate the top one
        if( alertQueue[ 0 ].time === alertTime ) {
            // Play sound
        }
        alertQueue[ 0 ].time -= timeDiff;
        if( alertQueue[ 0 ].time <= 0 ) {
            let item = alertQueue.shift();
            item.cleanup();
        }
        else {
            const offset = Math.min( 500, 1200 * Math.sin( Math.PI * alertQueue[ 0 ].time / alertTime ) );
            alertQueue[ 0 ].elements.forEach( ( e, i ) => {
                e.position.y = -400 + alertQueue[ 0 ].yOffsets[ i ] + offset;
            });
        }
    }
}

async function OnChatCommand( user, command, message, flags, extra ) {
    if( ( flags.broadcaster || flags.mod ) &&
    	( command === "resetcomfyalert" ) ) {
    	location.reload();
    }
	if( ( flags.broadcaster || flags.mod ) &&
        ( command === "testcomfyalert" ) ) {
		showComfyAlert( user );
    }
}

let messageCounter = 0;

function OnChatMessage( user, message, flags, self, extra ) {
}

function getRandomInt( num ) {
    return Math.floor( num * Math.random() );
}

async function validateTwitchToken( token ) {
    return await fetch( "https://id.twitch.tv/oauth2/validate", {
        headers: {
            Authorization: `OAuth ${token}`
        }
    } )
    .then( r => r.json() )
    .catch( error => {
        // Auth Failed
        return {
            error: error
        };
    });
}

let clientId = "";

async function CreateGame() {
	try {
        Unicorn.Create( "unicorn-display", {
            width: 1920,
            height: 1080,
            // background: "#777777",// "transparent",
            background: "transparent",
            init: Init,
            update: Update,
            channel: gameOptions.channel,
            username: gameOptions.oauth ? gameOptions.channel : undefined,
            password: gameOptions.oauth ? gameOptions.oauth.replace( "oauth:", "" ) : undefined,
            onCommand: OnChatCommand,
            onChat: OnChatMessage,
            gravity: { x: 0, y: 0 }
        });
        ComfyJS.onConnected = async ( address, port, isFirstConnect ) => {
            if( isFirstConnect ) {
                if( gameOptions.oauth ) {
                    // Validate and check expiration
                    let result = await validateTwitchToken( gameOptions.oauth.replace( "oauth:", "" ) );
                    clientId = result.client_id;
                    if( ![ "user:read:email", "chat:read", "chat:edit", "channel:manage:redemptions", "channel:read:redemptions" ].every( v => result.scopes.includes( v ) ) ) {
                        console.log( "Need more permissions" );
                    }
                    if( result.expires_in < 60 * 30 ) {
                        // Will expire in 30 days. Need to generate a new link!
                        console.log( "Token expires soon. Need to generate new link" );
                    }
                }
            }
        };
    }
    catch( err ) {
        console.log( err );
    }
}

window.setupGame = setupGame;
