export const photonVersion = "1.4.3";		/// <change version script>

export const photonChangelog = {
	"1.4.3": {
		"Fixed": [
			"Fixed short links redirects (/r/.../s/...) not working",
		]
	},
	"1.4.2": {
		"Fixed": [
			"Actually fixed 1.4.0"
		]
	},
	"1.4.1": {
		"Fixed": [
			"Fixed 1.4.0"
		]
	},
	"1.4.0": {
		"New": [
			"Added setting to change reddit app id. This should avoid rate limit problems as the website grows.",
		],
		"Fixed": [
			"Fixed broken default app id"
		]
	},
	"1.3.4": {
		"New": [
			"Slightly reworked search panel. Clearer separation between search everything and search subreddit.",
			"Now avoiding low resolution preview images, when source image is also low resolution.",
		],
	},
	"1.3.3": {
		"New": [
			"Added setting to highlight seen posts (Settings > Post > Highlight seen posts)",
			"Added setting to display timestamps as absolute time (Settings > UI > Absolute Timestamps)",
		],
		"Fixed": [
			"Fixed markdown preview for some tables and nested lists",
		]
	},
	"1.3.2": {
		"New": [
			"Added tracking of remaining reddit API requests",
		]
	},
	"1.3.1": {
		"Fixed": [
			"Fixed display of several image and video links",
			"Removed gilded sort option (since awards have been removed)",
		]
	},
	"1.3.0": {
		"New": [
			"Added light theme (Settings > UI > Theme)",
			"Restored functionality of \"Load archived version\" button (hopefully)",
			"From the ⫶ menu you can load the archived version of a post or comment",
		],
		"Fixed": [
			"Scroll jumping when collapsing comments (maybe)",
		]
	},
	"1.2.0": {
		"New": [
			"When revisiting a post, new comments will be highlighted (can be disabled in the settings)",
			"Added opt-in option to view quarantined subreddits",
		],
		"Fixed": [
			"imgur.io links not working",
			"Some gifs/videos showing up as images",
			"Fixed new type of user reddit links (example /u/.../s/...)",
		],
	},
	"1.1.25": {
		"Fixed": [
			"Fixed new type of reddit links (example /r/.../s/...)",
		],
	},
	"1.1.24": {
		"Fixed": [
			"Fixed issue where hiding the FAB button would reset when reloading the page",
			"API usage statistics now only track the endpoint type and not exact path",
		],
	},
	"1.1.23": {
		"Fixed": [
			"Fixed missing audio for new v.redd.it videos",
			"Changed subreddit in introduction sequence from r/eyebleach to r/Rabbits, due to the current blackouts",
		],
		"Note": [
			"According to my data, the upcoming reddit API changes will not affect photon. The request count is below 100 requests per minute, which is the limit for the free tier.",
		],
	},
	"1.1.22": {
		"New": [
			"Disabled checking for new messages. You can re-enable it in the settings (Other > New messages checking interval).",
			"Increased shortest message checking interval from 30s to 5m.",
			"These changes are in anticipation of the upcoming reddit API pricing changes."
		],
	},
	"1.1.21": {
		"New": [
			"Added metrics for reddit API usage, due to upcoming API changes. For more information see reddit.com/r/redditdev/comments/13wsiks",
		],
		"Fixed": [
			"Fixes for some giphy, imgur and postimg videos and images",
		]
	},
	"1.1.20": {
		"Fixed": [
			"Fixes & improvements to pushshift comment loading (\"Load Archived Version\" button)",
			"Fixed unrelated child comments being loaded from pushshift",
			"Improved loading time of pushshift comments"
		]
	},
	"1.1.19": {
		"Fixed": [
			"Fixed pushshift not working (Needed to \"Load Archived Version\" of posts/comments)",
			"Disabled redgifs API until it's fixed again :/",
		]
	},
	"1.1.18": {
		"Fixed": [
			"Fixed redgifs not working",
		]
	},
	"1.1.17": {
		"New": [
			"Added option to change default frontend sort order (Settings > Post > Default Frontpage sort order)",
		],
		"Fixed": [
			"Increased space between images and text from previous update",
		]
	},
	"1.1.16": {
		"New": [
			"Support for images with self-text (new reddit update)",
			"Collapsed comments now show the upvote count",
		],
		"Fixed": [
			"Fixed XKCD images not displaying correctly",
		]
	},
	"1.1.15": {
		"Fixed": [
			"Another cache not updating fix.",
		],
	},
	"1.1.14": {
		"Fixed": [
			"Fixed login not working properly.",
		],
	},
	"1.1.13": {
		"Fixed": [
			"Twitch videos are currently not working. For now displaying in embedded iframe instead.",
		],
	},
	"1.1.12": {
		"Fixed": [
			"Some small fixes & changes",
		],
	},
	"1.1.11": {
		"New": [
			"Added buttons to view deleted comments & posts (similar to removeddit/reveddit/unddit) (data provided by pushshift)",
		],
		"Fixed": [
			"Some small fixes & changes",
		],
	},
	"1.1.10": {
		"Fixed": [
			"Added some safeguards in case of data corruption",
		]
	},
	"1.1.9": {
		"New": [
			"Added \"Retry\" button when loading subreddit or comments fails",
			"Flair colors from Reddit will now have more contrast to make reading easier (no more bright background with bright text color)",
		],
		"Fixed": [
			"Some small fixes & changes"
		]
	},
	"1.1.8": {
		"New": [
			"Added several new ways to browse posts (Settings > Post > Post display type)",
			"1. Cards (not new) (default)",
			"2. Compact: Old Reddit inspired",
			"3. Grid: Displaying as many posts as possible for sensory overload",
			"4. Individual: Displays one post at a time and auto loads comments. Navigate with arrows",
			"",
			"Added one time confirmation for viewing embedded media (like YouTube and Twitter), cuz privacy 'n stuff",
		],
		"Fixed": [
			"Some small fixes & changes"
		]
	},
	"1.1.7": {
		"New": [
			"Added loading indicator to YT videos & Tweets"
		],
		"Fixed": [
			"Small fixes"
		]
	},
	"1.1.6": {
		"New": [
			"Added support for xkcd images",
			"Added support for ibb.co images",
			"Added info for deleted/removed posts",
			"Added option to change resolution for twitch clips",
			"Changed subreddit search api to autocomplete api (results should be a bit better)",
		],
		"Fixed": [
			"Many small changes & fixes",
		],
	},
	"1.1.5": {
		"New": [
			"Added optional setting to animate entering/exiting fullscreen (Settings > UI > Animate fullscreen transition)",
		],
		"Fixed": [
			"Fixed \"Load more (x)\" comments button not working",
			"Fixed twitter videos not being able to enter fullscreen",
		],
	},
	"1.1.4": {
		"New": [
			"Added setting to auto collapse pinned comments",
			"Added setting to filter comments by username",
			"Added setting for finer volume control for videos",
			"Videos in fullscreen will now hide the cursor",
			"Added button to load HD images (shortcut H)",
		],
		"Fixed": [
			"Hopefully fixed play/pause button animation freezing",
			"Slightly improved performance for comments (by incrementally loading as you scroll)",
			"Many small changes & fixes",
		],
	},
	"1.1.3": {
		"Fixed": [
			"Fixed search subreddit by flair not working",
			"Other small fixes"
		],
	},
	"1.1.2": {
		"Fixed": [
			"Some small changes & fixes",
		],
	},
	"1.1.1": {
		"New": [
			"Added subreddit message when viewing a private subreddit",
			"Added small icon next to subreddit name (can be disabled in the settings)",
			"Added setting to adjust width of posts",
			"Added setting for optional before exit confirmation",
		],
		"Fixed": [
			"Many small changes & fixes"
		],
	},
	"1.1.0": {
		"New": [
			"Reworked infinite scrolling feed",
			"When loading new posts, old posts won't be completely removed",
			"This should fix scroll position jumping",
			"And maybe improve performance a bit"
		],
		"Fixed": [
			"Many small changes & fixes"
		],
	},
	"1.0.5": {
		"Fixed": [
			"Fixed some old gfycat videos not working",
			"slightly improved pinned top header",
			"added more error handling",
			"Other small fixes & changes"
		],
	},
	"1.0.4": {
		"New": [
			"Added settings to hide various post UI elements (title, flair, crosspost info, ...)",
		],
		"Fixed": [
			"Many Small fixes & changes"
		],
	},
	"1.0.3": {
		"New": [
			"Post upvote percentage now visible when hovering over upvotes number",
			"Reduced text size for smaller screens (laptops)",
		],
		"Fixed": [
			"Small fixes & changes"
		],
	},
	"1.0.2": {
		"New": [
			"When searching for subreddits the subscriber count is now displayed",
		],
		"Fixed": [
			"Some reddit video links not being recognized",
			"Play/Pause button animation sometimes being out of sync",
			"Some minor changes"
		],
	},
	"1.0.1": {
		"New": [
			"You can now filter out posts (by subreddits, user, title, or flair)",
		],
	},
	"1.0.0": {
		"New": [
			"Added support for multiple user accounts",
			"(Add new users and switch users from the actions dropdown)",
			"Reddit emojis in comments are now displayed",
		],
		"Fixed": [
			"Many small fixes & changes"
		]
	},
	"0.6.8": {
		"New": [
			"Gifs in comments are now displayed as text instead and can be expanded manually. (to auto expand: settings > General UI > Expand media previews)"
		],
		"Fixed": [
			"Lots of small fixes"
		]
	},
	"0.6.7": {
		"Fixed": [
			"Fixed reddit preferences not showing"
		]
	},
	"0.6.6": {
		"New": [
			"Added some Reddit Preferences to the settings",
			"Added dagger † to controversial comments",
			"When the photon servers are down, there is now an option to load a cached version of the website"
		],
		"Fixed": [
			"Inline media links are now only loaded on demand",
			"Reworked tooltips display (should now always be visible)",
			"Fixed displayed sort order for comments",
			"When changing comments sorting, now auto scrolls back to the top"
		]
	},
	"0.6.5": {
		"New": [
			"Reworked Settings:",
			"Completely new UI",
			"Auto saving",
			"Auto sync between tabs",
			"Search through settings"
		],
		"Fixed": [
			"Fixed some searches displaying errors for suspended users",
			"Small fixes"
		]
	},
	"0.6.4": {
		"Fixed": [
			"Improved UI consistency when (un)subscribing to/from subreddits and creating/editing/deleting multireddits",
			"Small fixes"
		]
	},
	"0.6.3": {
		"New": [
			"Quick Search subscribed subreddits",
			"Create, edit, delete multireddits"
		],
		"Fixed": [
			"Fixed adding/removing subreddits from multireddits",
			"Many small fixes & changes"
		]
	},
	"0.6.2": {
		"New": [
			"Added fully customizable FAB (floating action button, in the bottom left corner)",
		]
	},
	"0.6.1": {
		"New": [
			"Reduced first time loading time (base website is ~200KB)",
			"Reduced text size again (now 107% of normal size)"
		],
		"Fixed": [
			"Some small fixes"
		]
	},
	"0.6.0": {
		"New": [
			"Added initial support for Safari"
		],
		"Fixed": [
			"Some small fixes"
		]
	},
	"0.5.13": {
		"Fixed": [
			"Reduced the text size a little bit",
			"Fixed some bugs with the unread messages counter",
			"Some small fixes & changes"
		]
	},
	"0.5.12": {
		"Fixed": [
			"Some small fixes & changes"
		]
	},
	"0.5.11": {
		"Fixed": [
			"Some small fixes & changes"
		]
	},
	"0.5.10": {
		"Fixed": [
			"Some small fixes & changes"
		]
	},
	"0.5.9": {
		"New": [
			"Added option to play videos in lower quality by default",
		],
		"Fixed": [
			"Some small fixes & changes"
		]

	},
	"0.5.8": {
		"New": [
			"Added support for streamable.com videos",
		],
		"Fixed": [
			"Some small fixes & changes"
		]

	},
	"0.5.7": {
		"New": [
			"Improved subreddit adding to multireddits",
			"Added subreddit search when posting a post",
			"Added some info before logging in",
			"You can now delete messages & block users"
		],
		"Fixed": [
			"Improved performance when viewing comments",
			"Many small fixes"
		]

	},
	"0.5.6": {
		"New": [
			"Added markdown preview while writing/editing posts/comments"
		],
		"Fixed": [
			"Fixed posts initially not loading on smaller screens",
			"Some minor fixes"
		]
	},
	"0.5.5": {
		"New": [
			"Added/improved dropdown icons a bit"
		],
		"Fixed": [
			"Many small changes"
		]
	},
	"0.5.4": {
		"New": [
			"You can now change the video quality on videos from reddit or gfycat",
			"Improved video playback speed setting",
		],
		"Fixed": [
			"Several bugs related to editing posts & comments",
		]
	},
	"0.5.3": {
		"New": [
			"Video pop out",
			"List of subscribed subreddits & search results now have subreddit/user/multi icons",
			"Added icons to most dropdown entries"
		],
		"Fixed": [
			"Unified color scheme",
			"Many small fixes and changes",
		]
	},
	"0.5.2": {
		"Fixed": [
			"Unified color scheme",
			"Many small style adjustments",
		]
	},
	"0.5.1": {
		"Fixed": [
			"Many small fixes and changes",
		]
	},
	"0.5.0": {
		"New": [
			"Reddit login and authentication is now done completely in the browser",
		]
	},
	"0.4.9": {
		"Fixed": [
			"Many small fixes and changes",
		]
	},
	"0.4.8": {
		"Fixed": [
			"Many small fixes and changes",
		]
	},
	"0.4.7": {
		"Fixed": [
			"Many small fixes and changes",
		]
	},
	"0.4.6": {
		"New": [
			"Improved loading time on page load",
			"Touch support for media zooming & dragging",
		],
		"Fixed": [
			"Some problems with infinite scrolling and hidden posts",
			"Many small fixes and changes",
		]
	},
	"0.4.5": {
		"Fixed": [
			"lots of styling fixes",
		]
	},
	"0.4.4": {
		"Fixed": [
			"Fixed some minor bugs",
			"Small design and behaviour adjustments",
		]
	},
	"0.4.3": {
		"New": [
			"Added a quick guide for new visitors",
			"Added support for /r/sub/about urls"
		],
		"Fixed": [
			"Fixed tab title not changing when going back",
			"Fixed potential problems"
		]
	},
	"0.4.2": {
		"New": [
			"Crossposted posts now have a link to their original posts",
			"Added button to view all crossposts of a post"
		]
	},
	"0.4.1": {
		"Fixed": [
			"Some twitch clips not working",
			"The scroll position changing unexpectedly"
		]
	},
	"0.4.0": {
		"New": [
			"Added sending of messages",
		]
	},
	"0.3.0": {
		"New": [
			"You can now view polls (voting isn't supported by the API)",
			"Dedicated page for /r/random + similar",
			"Configurable message checking interval"
		]
	},
	"0.2.9": {
		"Fixed": [
			"Fixed problems from previous patch"
		]
	},
	"0.2.8": {
		"New": [
			"Image & Video lazy loading (only loaded when they are almost visible)"
		],
		"Fixed": [
			"Website not working when not logged in",
			"Some posts not showing up when scrolling up"
		]
	},
	"0.2.7": {
		"New": [
			"Images and Video will only be loaded if they are from trusted sources"
		],
	},
	"0.2.6": {
		"New": [
			"Editing post flairs",
			"Changing a users subreddit flair",
			"Flairs with editable text are now supported",
			"On posts the nsfw or spoiler state can now be changed",
			"Reply notifications on posts can now be edited"
		],
	},
	"0.2.5": {
		"New": [
			"Support for giphy.com gifs",
			"Reddit gifs in comments now use the media player",
		],
		"Fixed": [
			"Inline media with portrait orientation being too big",
			"Caching problems",
		]
	},
	"0.2.4": {
		"Fixed": [
			"Comments sorting button not appearing",
			"long subreddit names breaking the UI",
		]
	},
	"0.2.3": {
		"Fixed": [
			"Tweet display error",
			"Caching",
		]
	},
	"0.2.2": {
		"New": [
			"Caching of imgur, gfycat, and youtube-dl api requests"
		],
		"Fixed": [
			"Space bar not working",
			"Gallery item captions being too large",
		]
	},
	"0.2.1": {
		"New": [
			"Added option to rotate & apply filters to media elements"
		]
	},
	"0.2.0": {
		"New": [
			"Reworked image & video viewer",
			"Reddit + imgur galleries now also support videos",
			"Reworked inline media",
			"All image, video, imgur, etc. links in comments or text posts can now be directly displayed",
			"Some other changes and fixes",
		]
	},
	"0.1.3": {
		"New": [
			"Improved comments loading by instantly displaying already loaded post",
			"Added option for autoplaying videos",
			"Added option for syncing volume between all videos",
			"Bug fixes",
		]
	},
	"0.1.2": {
		"New": [
			"Added Changelog",
		]
	},
	"0.1.0": {
		"New": [
			"Photon now has versions"
		]
	}
}
