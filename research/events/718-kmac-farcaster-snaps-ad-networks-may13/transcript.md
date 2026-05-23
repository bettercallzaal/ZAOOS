# Transcript - kmac.eth x Zaal: Farcaster Snaps (2026-05-13)

Attendees: Zaal, kmac.eth.
Transcribed locally via mlx-whisper large-v3-turbo. Verbatim Whisper output - run-on, no speaker labels.

---

What about it is, how's it going?
It's going all right.
It's going all right.
I like the ceiling.
We both got views of each other's ceiling here.
This is great.
That's the only way I hide my chins, you know?
Yeah, that's funny.
Yeah, I'm on my laptop, which is why.
But yeah, dude, so Snaps.
I'm on Zelda's Talk Shop about it.
So when I see those things, I'm like, okay, this is like a new web widget.
Why are they stuck in Farcaster, right?
I just look at them as this interactive thing,
these little mini apps that could go anywhere and exist on the web,
but they don't.
So when I see your thing, I'm just like, oh, that's pretty close.
And look, oh, you can even interact sort of with them.
He did something to let me interact with them.
I'm like, okay, this is inspirational.
Maybe we can move these out into the web.
And I use like an add unit,
but that's probably not the framing we want initially.
But anyway, the point is that these are web widgets
that an Anon user should be able to use.
They should be able to then authenticate.
So at least we know their FID.
Oh, this person is this FID.
And then eventually they may be trust enough to say,
this widget should be able to sign for me
and cast and stuff like that.
So when I look at these things, I'm like, okay,
if we were to then scope that down to,
okay, how can we make money from this?
These could be interactive ad units, right?
And you just drop a snippet on a webpage.
It's going to then do this match saying,
okay, who's viewing, which publisher,
and what inventory do I have of snaps
that I can fill into that space?
And that's kind of the fun, easy part.
We can use, I say easy.
Anyway, bad habit.
We can use the HyperSnap hub or Snapchat,
whatever to say, okay, here's a feed,
just like the social feed,
but here's a feed of casts that have snaps in them
that we've queried and filtered
to match the advertiser to the user.
Okay?
Yeah.
No, that's super interesting.
But that unit then is something that's,
you know, it's got all the properties of a snap.
It's dynamic.
It can be personalized if you're authenticated.
So you can get things like a sports betting prediction market,
whatever kind of snap that's like,
got your friends as part of it.
And like, there's this really kind of cool thing
that should exist outside of a client,
out on the web in the wild,
or in somebody else's feed or something, right?
So anyway, that's why I get excited about these snaps.
And when I saw your stuff, I'm like,
oh, this is the snap builder part.
This is like the kind of build this app.
And I'm like, these snaps.
And I'm like, okay, but there's this problem.
Whenever there's a snap that shows up in, say, Farcaster,
there's what's called a JFS,
which is a Java Farcaster signature or something like that.
And they do this kind of like very serious authentication,
a very high level of trust to say,
oh, yeah, this user can tap these buttons on the snap.
And it's way overblown.
Like, you shouldn't need to know anything about me
for me to hit the next button in a snap.
Yeah.
Right?
And so I...
It's a very baseline for everything, basically.
Yeah.
So they just went to the top and said,
nope, you know, you need to be, you know,
completely authenticated with signer privileges to do a post.
And because that post could be casting
or it could be token transfer,
it could be whatever.
Right?
So they didn't take those actions that are on a snap
and parse them out to different types,
like low risk, medium, and high.
They just said, they're all one thing
and you've got to have a signer to use it.
Or a JFS, not a signer, a JFS.
So what you had done, intentionally or not,
was you had an API route and then like a web route.
And your web route is just saying,
screw that signer shit, just, you know, forget that.
And that's kind of cool, but you're hosting that snap.
I know it's something like Compose Cast, essentially.
So there's four...
Or are you using the API to like build the thing?
So I went...
Okay, so when I look at your repo...
Where did you see those?
Yeah, yeah, okay.
So when I look at your repo,
oh, I got to find one.
Am I logged in?
Where's mine?
My snaps.
My snap view.
When I view my snap...
Oh, okay.
There we go.
Maybe I wasn't sharing it before.
But I basically shared with it the chat GPT query.
I basically copied and pasted the whole thing
and synthesized this.
And then it was saying, I was saying this stuff.
So I was like, no, like, let's give some credit.
No, no, no, it was K-Mac.
No, I don't.
I don't.
But like, I also don't want it to like,
not know my information.
And then, you know,
the beauty of this here is it's a save.
And the first thing was,
want me to pull recent casts for context?
I was thinking.
I was like, fuck it.
Bet.
Like, let's go with that.
So that's where we're going at with it right now.
So, yeah.
I think...
Very cool.
Boom.
What did you just say right there?
So, yeah.
I can barely see it.
I'm so blind.
Oh, yeah.
Let me see if I can...
Pushing FIP to relax.
Yeah, yeah, yeah.
To relax to GFS sign and require.
That's exactly.
And Cassie chimed in
because I was talking to...
Whenever I'm, like, slightly passive-aggressive,
I talked to Nainar in public.
Like, because I know Rich reads every one of those.
So I'm, like, asking these questions.
I'm like, ah, this seems kind of strict.
And Cassie chimes in and is like,
yes, pretty much this is ridiculous.
Like, it's very locked down right now.
But your Slank Online
has the ability to view these snaps
and interact with them.
Like, the code is actually saying,
hey, if I'm in WebView,
if I'm not in the context of a client,
soften these requirements on the signature.
I don't know if you knew that was there or not,
but it's really pretty awesome.
So...
I did not.
Yeah, yeah, okay.
So this is where I was like,
oh, you're doing something
that I was going to have to go do this.
But you already did it.
Perfect.
Well, that's why I love open source code, right?
Like, I am a very...
So I'm young and, like,
hopefully idealistic
and, like,
we can make the world a little bit better.
The world will take care of you.
You'll get jaded eventually.
Well, I used to be way more jaded before,
which is the wild part.
But essentially,
my thought now is
I'm essentially building a community layer
of a bunch of different people in our community.
And I want to create something
where I'm just creating
a ton of different primitives all over
that other people can eventually, like,
come in and see
and maybe be like,
oh, like,
I can build on top of that.
Like,
or I can clone this
and, like,
build this out.
So, like,
I'm just trying to, like,
make all of my ideas
synthesized as quickly as possible
to at least a draft.
And, like,
that's the goal for me right now
because I have a lot of things
that I haven't ever been able
to, like,
get to the resource pipeline through,
right?
And, like,
now is the best time
to be able to do things like that.
So, it's crazy.
And I have a distribution mechanism,
which is Farcaster,
which is amazing.
Like,
people don't realize how crazy it is.
I've been making a client
in the last few,
like,
last month or so
because, like,
it's my synthesis of Farcaster
and the, like,
beauty of it is
any, like,
user that's going to use it
as a social platform
and network
can, like,
create their own front end
for their community
of how they want
their community
to interact with this protocol.
It could,
like,
my,
like,
back front end right now
is literally,
like,
our four channels
and then the trending feed
from Sofa
and that's it.
Like,
we don't have any other trap
because, like,
my goal is
it's a community hub.
It's like,
Right.
Don't distract me with the noise.
This is what we care about.
So,
yeah.
So,
I'm really excited to,
let me ask you about that.
The client that you're building,
is it a full onboard
of new users
from out in the wild?
No,
not right now.
Or you assume
they have a Farcaster?
Yeah,
well,
you need a Farcaster
and sign in right now.
But at any point,
I could change that to a wallet.
But, like,
I'm,
if I'm,
I basically have it locked down
to Zao users,
like,
people who have the Zao governance token
and our governance token
is illiquid and soul bound.
So,
you have to earn it.
Every week,
we have meetings
that you can come in
and participate in,
essentially,
and people earn it over time.
And,
and that's our governance structure
of the Zao as a whole.
So,
the goal is,
ultimately,
we incubate projects,
individuals that are part of this Zao,
or just different community members
with different projects
affiliated with them.
And,
they can kind of organize
the social capital
of different people
having this governance token
to build through ideas
and form teams
of sweat equity
with the chemistry
and consistency
of,
like,
having the resources
from this,
like,
greater org
and,
like,
all the other things
we're doing,
right?
So,
that is,
like,
what I normally use
for my,
like,
reference for a lot of things,
essentially.
I'm just like,
hey,
what do you guys think?
Well,
that's cool,
too.
Yeah.
So,
as it relates to,
I think that the original
kind of spark
on the Connector
and the DMs was,
I was like,
I think there's an ad network
to be had here.
That was the framing,
whether or not
that's the right one.
Yeah.
Really,
my thinking was,
there's a way
to use these snaps,
which your tool authors
quite nicely.
and put them out
in the wild
so people can embed them
on websites
and then progressively
onboard people
that are interacting
with those
on,
like,
a WordPress site
or on a whatever.
Yeah,
yeah,
yeah,
yeah,
yeah.
So,
you just have a poll.
We can send it
to a Twitch chat,
right?
Like,
so,
we've been basically,
me and one of my community members
have been diving really deep
into Twitch
because he's really,
like,
well,
we both had
the person that onboarded us,
this musician,
to his community,
transition to being a Twitch streamer,
and moving his community over there
and,
like,
going web two,
and we've been seeing a lot of growth
and we hate,
like,
there's a lot of bad content out there as well,
so we're trying to,
like,
create,
like,
very more on the educational side,
especially around crypto.
He's doing it every day.
I'm way more interspersed,
like,
trying to bring in,
like,
different people to interview
and different things,
but I've seen,
like,
a lot of growth
in the potential of,
like,
having these people,
young people that watch Twitch
and,
like,
pay attention on Twitch
are young enough
to want to do crypto
but have just heard bad things.
That's it.
Like,
you just have to educate them correctly.
They're so willing to spend the money.
Like,
that's not an issue,
right?
Like,
internet money is not
a foreign concept to them
and it's the right people.
It's just,
like,
stuff like this
would be great ways to onboard them.
So,
yeah,
no,
I like that.
So,
you have,
like,
a basic poll
and then it's like,
okay,
hey,
if you want to,
like,
get some free,
like,
crypto,
like,
come make a Farcaster
and get some.
Yeah,
you actually tap on the snap
and it opens a QR code.
Yeah.
Right?
Well,
I'm saying,
like,
it's more of a,
like,
you,
anyone can claim it
but,
like,
you claim it on Farcaster
because you're claiming it
as a Farcaster user,
right?
Yes,
exactly.
So,
it becomes this onboarding path
to get somebody in
and there's an incentive
to do that now
thanks to the HyperSnap stuff.
So,
any app that onboards
earns more rewards.
That's actually probably
the most rewards
and then it's,
then it's any users
of an app
that uses HyperSnap.
That is also
an incentive.
Now,
these are all snaps
and how much are snaps worth
and will they be worth anything?
Who knows?
But,
there's at least
this kind of call option
of,
like,
huh,
we can all align
towards trying to grow this,
grow this where
the engagement
is actually authentic
because it's got
a pretty significant
kind of spam filter.
So,
anyway,
I started thinking,
okay,
well,
how do you get more users?
Well,
you get out of this,
like,
walled garden
that we're in
and you put
our stuff
out in the web
and out in other places
and other social contexts
and how can you do that?
Snaps are super close
to being able to do that
and your,
your builder,
I was like,
oh,
look at this.
It's a website
and there's,
like,
partial interaction
of these snaps.
this is almost there.
Cool.
Yeah,
no,
we can easily build it out
like I had
before
actually winning the thing
because,
like,
I was just,
like,
again,
not really expecting
much with it
but now that you're
telling me all this
it makes a lot more sense
actually
because it was actually
well engineered
and it's just,
like,
over time,
like,
improving the prompts,
like,
that's the biggest thing
that,
like,
I've been focused on
personally
and,
like,
how can I teach
my musicians
and other artists
to be able to do
those things as well
but,
yeah,
no,
I hadn't thought
much of,
like,
okay,
like,
this isn't bad.
There's,
like,
things we could do here
and bring back
because,
like,
I've always wanted
to bring in
some of,
like,
the partner brands
like Empire Builder
and,
like,
create templated things
that are,
like,
very geared towards,
like,
different brands
that are out in there
in the ecosystem,
right,
like,
different projects
of many different types
where,
like,
there's so many easy ways
to play around with them
especially if we have
something that,
like,
collective people are going to
and,
like,
adding suggestions
and,
like,
bringing things in.
So,
yeah,
no,
I think there's a lot of ways
we can rock and roll with it.
Let me,
let me ask you this.
This is,
this one I haven't quite,
quite solidified in my mind
but I know that this will happen.
I just don't know
what it'll look like.
We have ad networks
for people,
right?
Like,
we put up banner ads,
we put up text ads,
you know,
all sorts of ads,
ads,
ads,
ads.
What's that going to look like
in the agentic world?
In,
like,
an agent-to-agent
kind of autonomous?
I honestly,
so,
okay,
if you want my,
my opinion of how,
like,
it should be.
So,
like,
I don't,
I think we're,
I think somewhat,
even just saying the word ad
is thinking about it wrong.
My goal,
and I need a way to frame it.
Yeah,
yeah,
yeah.
So,
what I want to do
and what I'm creating
is cultivating
a community
of culture
where people want to be there,
A,
but also
there
is
an underlying incentive
of,
like,
giving the creators
within the brand
the opportunity
to make money
through the brand,
right?
Like,
by saying,
like,
everything that,
like,
influence had done,
right?
Like,
I don't know who it was
was saying that was,
like,
influencing spam
in the chat,
which I thought was hilarious
because,
like,
semi-yes,
but also,
like,
it was honestly
one of the best ones
I've seen.
Yeah.
There,
also,
like,
I'd much rather,
like,
personally get,
like,
give money
in an ad
to,
like,
if I know it's going,
like,
right to that individual,
right?
Like,
I think there's a lot more
benefit of,
like,
that peer-to-peer benefit,
but,
like,
the thing that...
I think that out
to the web now.
That is exactly that,
but everyone.
You want the people
that know your brand
the most,
that for,
like,
the life in them
would want to represent
your brand anyways.
Like,
you bring out the clippers,
you bring out the,
like,
the people that,
like,
in your community
are the most devoted people,
and you make those
your advertisers,
right?
Like,
that's the people think
people are missing.
Like,
everyone,
for me,
I think,
like,
everyone always thinks
in Web2,
right?
Like,
we got to go
and get an ad agency,
a group of people
to help us
outside of our brand,
right?
And the challenge there is
they do that for a living.
So,
like,
from brand to brand,
they don't see,
like,
what's special about this
and this ecosystem necessarily.
They're just making
a generic brand
that ad that works
for everything,
right?
We'll get you reach.
Exactly,
right?
And I think
the best people
for your brand
is always going to be
the people
within your community,
the people that,
like,
believe in you the most
because they'll want
to do it for free.
So,
now,
if you give them money
to do it,
they'll do a much better job
at making that effort.
And you can,
like,
my goal has always been
how do we filter out
bad influences,
right?
So,
that's why I created
the respect game.
Well,
I didn't create
the respect game.
That's why I started
leveraging the respect game
in our organization
and started using it
to collectively collect.
I'm not sure I'm familiar
with it.
What is it?
Okay,
sorry,
yes,
I forgot.
I just jumped on a call
before and I was talking
about it.
That's why.
Essentially,
we meet weekly
to distribute out
this token
and in groups of six,
people share what they've done
in the last week
to progress the ecosystem forward,
which is anything
in advancing tech
and art.
And in that group of six,
people will reach consensus
on who's done the most,
the second most,
the third most,
the fourth most,
the fifth most,
the sixth most,
and everyone gets
a certain amount
of distribution
of the token
that's,
again,
soul-bounded liquid.
You can only earn it
through participating
in the weekly meetings
by sharing,
knowledge sharing,
essentially,
on what you're working on
to help everyone,
right,
in the collective.
And people get,
based on,
it's a Fibonacci sequence,
so like the higher ranks
actually get a significant
amount more.
So it's like,
it really is supposed to be,
once you have like 36 plus people,
you can actually bring
the top people
of every single group
into another fractal of six,
right,
because you have 36.
So the concept
is being able
to actually scale up
to like a big,
whatever number,
because you have created
fractal groups of like,
it can row to any amount
and it's still kind of like,
it doesn't matter if it's one,
it doesn't matter if it's 100,
it's still done the same.
Mm-hmm, I see.
So that's what we've done
and this,
we just had on Monday,
our 99th week,
this upcoming one
is going to be our 100th.
and we started learning
that from a different community
of a different group,
Eden Fractal
and Optimism Fractal
and like really kind
of perfected the concept.
So like,
I just kind of jumped on board
with like my artist group
and like been like,
this is amazing,
we're going to do it,
I'm going to use this
as my thing.

and so-
Is that the name of it again?
It's called
Send me the notes
when we're done.
Send me the notes
when we're done.
Yeah, I think,
all I have to do,
I think is share it
with your email.
What I was going to say was,
let me just,
oh yeah,
I'll just share it
with you after
and then I'll remember.
But yeah,
so that's kind of
what we've done.
Zao Fractal is ours.
Optimism Fractal
is what I joined at first.
which was specifically
geared towards
the optimism blockchain,
like things you are doing
to forward the optimism ecosystem.
Not like by optimism itself,
like there were
a couple of grants
that they got and stuff.
But just like this
group that like
had been a part
of Eden Fractal,
which was the cultivation
of fractals as a whole,
which had previously
been fractally
and previously
had been on EOS.
I don't know.
So I'm not part of that,
any of that.
I just joined at the very end,
the last stem
and I'm the like
new stem essentially.
So yeah,
it's beautiful.
Divergence, man.
Divergence is the way.
People upstream from you
to help give that like
support in specific ways
as well.
So yeah.
So that's what
the Fractal game is.
Got it.
Got it.
I'm able to like
have a trust network
of like our whales
or people that over time
have been supporting
as opposed to like
people with the most money.
Yeah.
And I don't remember
influence exactly.
So influence was like
peer to peer.
Like you essentially
as a user,
a lot of the users
were like more
of the AI spam users.
There were like
farmers, of course,
because you were
essentially getting
free money for
either recasting
or liking a post.
And you just put up
an ad, a $5 budget minimum.
Was this the one that
is the orange one?
Okay.
So, so I would,
I would cast and say,
hey, here's $5
or I'll pay a penny
to whoever recasts it
and people will go
recast it.
And it's like
you can do a multiplier,
but like, I don't know
why you would ever
not just do a one X.
I've always,
so like at this small cent
and it gives out like
anywhere between
seven to 70 cents
to a person
based on their mind shares.
Like that was
their whole big thing.
Oh, that was it.
That was the scoring one.
Right, right, right.
And I had the heat nap.
Wasn't bad,
but I also don't think
it was the best
it could be.
Yeah.
Yeah.
And did the,
the advertiser
in that case,
the one that put up
the money,
did they get
to choose
who it was?
Like it's got to be
a mutual follow
or something like that.
Uh,
was it just,
yeah.
In influence.
Oh,
oh,
oh,
oh no,
I don't think so.
I don't think
there was any like,
there was no filtering up.
Yeah.
There might have been
an Aenar score one,
maybe.
I don't know.
Like,
I,
I,
I'm not too sure
that specifics
to be honest with you.
Okay.
I did.
I'm fascinated
by that whole space.
I did an interview.
Kind of kicked it off.
Yeah.
I did an interview
with Ali actually.
I can send it over
to you as well.
Yeah.
Very cool.
Very cool.
Um,
yeah,
I think there's something
super powerful
that just hasn't quite,
quite clicked.
And part of it is that
Farcast are so small
and it's kind of like
all circle jerk around
and like,
oh,
we're promoting each other's
and,
you know,
where if we get out
into the world
and it's like,
hey,
I've got this ad up there.
And as you were saying,
only the true fans,
only the ones I,
as an advertiser,
follow back,
right?
Like there's a mutual.
Those are the only ones
I can earn
from amplification.
Um,
so like I,
I,
part of it,
I think this is all really,
all the tools are right there.
Like it's,
it's all on hub.
It's all in these feeds.
We can use channels.
There's this new thing
landing from a hypersnap.
It's called,
what is it called?
Uh,
graph QL.
So you can now create these,
like these queries
that are,
you know,
between the queries
and the web hooks,
you just kind of listen
for things that happen
based on a certain set of rules.
Uh,
so I'm like,
oh,
that could be the way
to filter this stuff.
Like only,
only show the amps
from these people.
Um,
anyway,
I think there's just
a really ripe
set of stuff there.
And with this token
out there now,
pretty widely distributed,
I'm like,
Hey,
might be worth trying
to see if there are
a bunch of people
want to get together
and try to,
try to create something.
I want to learn more
about the data behind it.
That's what I want.
I said,
I want to learn more
about the data behind it.
Um,
Cassie's out about
catching a bunch
of simple rings.
I'm not going to lie to you.
There's so many messages
in the chat.
I have not kept up
with all of them.
So that's what I'd love
to chat with you
more about of like,
sure.
Letting me know
important information
based on that
because it's so hard
to keep up.
I was during like
a good period
and just like
in the last week,
it's like,
it's all a trade-off.
You can't stay on it all.
But I,
I definitely had
a front row seat
for,
it was,
uh,
MVR,
something with an M,
Mon,
Mon,
Mon,
Mon,
Mon,
Mon,
Mon,
Mon,
Mon,
Mon,
Mon,




Mon,

















Mon,
Mon,
Mon,


Mon,
Mon,
Mon,

Mon,

Mon,


Mon,
Mon,


Mon,

Mon,

Mon,
Mon,

Mon,

Mon,




Mon,

Mon,

Mon,


Mon,

Mon,


Mon,
Mon,
Mon,

Mon,
Mon,

Mon,

Mon,
Mon,
we're down to the last one.
And we're like,
okay,
this is,
this is pretty good.
Pretty good.
We put it out there,
you know,
everyone gets the rewards.
And then you can see based on the claims,
like if they were all like funded from the same wallet.
So you'd be like,
oh,
we missed this 32 account ring.
We missed this.
There was one that there was only two of significant value.
And I say significant,
they weren't,
you know,
single dollar amounts.
They were like,
somebody got like a,
I think,
like a single,
not dollars.
This is wrong.
Snaps.
Somebody got like 1100 snaps.
That was like the biggest one we missed.
But then Cassie's like,
well,
now we know where they are.
So she updated the algorithm so they don't get it going forward.
And that was super interesting.
There is a spreadsheet out there.
It was posted.
And there was distribution,
right?
Yeah.
So it was one of those things where there was a group of us that were like,
let's not hunt anybody.
Because there was one or two names on there that were recognizable.
Yeah.
Yeah.
I mean,
I wrote Jody at the top.
I don't know if that was.
Okay.
Yeah.
You got it.
All right.
I didn't want to say it.
Well,
okay.
Well,
like I know we're on recording,
but there's a problem with like yellow collective where like he has this prop out that like
apparently it's also the only one dude is like hounding him over it,
but he basically got like $11,000 to do like eight episodes.
It's not even that difficult to think,
but I think there's someone else that's involved.
Jack wilds.
That's like more AFK now.
So I think that is the challenge.
And I get that,
but he's basically just not being accountable in this group chat.
Basically it's been on for months because I joined late yellow like six months ago.
So it's like,
yeah.
So I,
yeah.
Okay.
Cause like,
that's what I thought I read when I was reading the list.
Yeah.
You nailed it.
Figure it out.
You nailed it.
Yeah.
It was.
Yeah.
But I,
I was super impressed that out of,
you know,
what was I think millions of,
uh,
of accounts and,
and that were,
that were caught in the net only really two of kind of like,
Oh,
that's real money.
You know,
like we're kind of seeped through and then they,
you know,
swept up at the end.
So I'm like,
Oh,
this is going to be a pretty good spam filter until the next round.
Then someone will game it and we'll catch up.
And we'll see you guys.
And then how much do you know about the Entori home DB?
Oh,
no,
I don't.
He's dope.
He like that DB,
he's creating Entori SCIS.
Yes.
Let me see.
Hold on.
Let me.
I Entori.
Oh yeah.
I,

hold on.
Let's get over there.
I am D O.
In Tori T O.
Go T O.
Yeah.
Right.
Right.
I've seen this.
Um,
I'll send you a link here.
This is why I'm like partnering with him as well and doing some stuff.
He's getting a crazy amount of good data as well on users.
Um,
and just like how people interact for specifically farcaster and like leveraging,
like the fact that we are doing these things publicly on the internet,
but there's no,
like also accountable way to like level,
like,
okay.
Contributions,
like,
especially like real ones.
And like,
my goal is a peer to peer system.
Like that's what I'm creating.
Of course.
Yeah.
Yeah.
There's huge levels like this where like,
I want to work with you guys as well.
Like you guys being like all these other big,
like people who have an enormous amount of data on everyone.
Right.
So it's like,
like I can also level set like layers of authentication based on other people's data of users.
Right.
And I think something like that's super valuable.
Oh,
you see in Tori putting this stuff on,
uh,
let's call it on node.
Um,
like you take these quizzes and you give all this kind of like preference information.
I don't,
this is the part that bothers me a little bit.
Like,
unless there's some incentive that shared out with the community,
like it's kind of farming preferences.
It's,
it's the same,
same thing.
And web is web,
web two did,
but now it's just in web three.
You know,
it's like,
Oh yeah.
Facebook knows everything about my preferences.
Uh,
and Tori now knows everything about my preferences.
But I think it's different when it's things that you're posting online.
And like,
I don't know.
I think like in this age of AI,
it's going to be absolutely insane.
But also like,
again,
I'm,
uh,
but I think they're doing stuff with privacy.
Like their focus is like keeping,
giving you as a user as much of the info and like keeping that private and secure.
Right.
But,
uh,
who else was it doing it?
There was somebody in New York.
Uh,
uh,
they were taking a much more of almost like a LinkedIn approach.
Um,
do you remember this?
Uh,
Jack was a Jack.
Oh,
uh,
what was it called?
I can't remember.
Uh,
interface maybe.
No,
not interface app.
Um,
uh,
but it was more,
it was,
it was very much a,
uh,
a testing to your so-and-so has skills and,
and such.
Uh,
and I was like,
Oh,
that,
that's pretty neat.
And now that was all,
uh,
ENS or EAS,
uh,
Ethereum attestation service.
So you could,
anyone could go query that stuff.
It was all kind of public and open.
These quizzes that are kind of like,
okay,
you want to know I like pepperoni pizza.
I'm like,
why?
Like,
I'm not there yet.
What's,
what's in this for me?
So,
but,
uh,
yeah.
And Tori,
I,
I remember seeing this going,
Oh,
there,
there's something here,
but I don't know what it was.
And I kind of moved on.
But you want the data for,
for what to try to build more communities based on the affinities.
Is that your,
your chance?
No more to like,
get like the,
like we have our personal community,
like filter.
Basically.
I want to be able to also have other people's filters that anyone in my community can turn on and off to like,
see different,
like people on different filters.
Right.
Like if that was the case or like all of them.
Right.
Mm.
Mm.
So like AI slot filter,
that's what Shaw,
Shaw makes magic set at East Boulder.
And I really liked that terminology,
trying to create the best thing that you can do for that,
for your people.
Right.
Yeah.
Yeah.
Yeah.
Got it.
What is this acronym?
S S C I S.
Did he explain what that is?
It says it up there,
I think,
right?
I can barely read.
You kidding me?
How to turn over time.
This,
introducing this,
this power is more.
I'm like,
I need the S equal,
S C equal,
I equal.
Have I just,
yeah.
It's a signal,
something.
Structured,
structured,
conversational inventory system.
Okay.
Got it.
Now it makes sense.
Why we built this.
I don't know.
I see.
I see.
I see.
I see.
Oh,
that is pretty cool.
Yeah.
Let's see.
Is the data open?
Yeah.
Very cool.
Very,
very cool.
So you have a pod coming up?
Like,
it's been,
it's been,
what's in 15 minutes.
You do it every day.
You do it weekly.
What do you do?
This one's weekly on Wednesdays.
I also do the one.
I also do interviews like on my own.
This one's with three other people co-hosting with me.
And we interview.
Give me the name of it.
I'm going to get it in my playlist here.
It's called.
Well,
it's not on like the regular platforms right now.
No,
you have to put a pod.
Okay.
Yeah.
No,
no,
no.
Like,
yeah,
not like fancy podcasts.
I'm just getting content out there for,
for the community.
Um,
but like,
um,
my goal is I've recently been doing more towards that,
but,
um,
I'm also doing it with my personal one.
And that,
so this one's called,
let's talk about Ethereum.
It's evolved from let's talk about web three,
which had started with me and my homie in,
uh,
spaces.
And then we evolved it to live streams.
Um,
so we did three seasons of that.
And then we did started.
Let's talk about Ethereum this year as an evolution of that with another
co-host.
And,
uh,
and then I also have my own better calls all yaps essentially that I just
do as like whenever I can get people.
So yeah,
that one's bcz yaps.com,
but I'm trying to do a similar thing to this one with let's talk about
Ethereum.
We're like,
all the transcripts are there.
Like you get all the details about all the past things.
I'm like really leveling up,
like a simple brand page that you could do in the past,
but like actually giving like agents,
good access to the information as well.
Very cool.
Very cool.
Um,
so with your,
um,
it was like online.
Yeah.
Kind of ad networking.
Is it something that you want to continue to riff on and just kind of float in
and out of and yeah,
I already see what happens.
Something like that.
I started building upon it.
Like,
uh,
I'm going to probably pop most of this through as well.
Um,
and then we'll just go from there.
Cause like,
I already,
my first thing I wanted to do anyways with this,
and I hadn't come back to building on it since,
uh,
since I had submitted it.
Well,
a little bit after I'd submitted it.
Cause like,
I was still working on that Sunday and Monday to like finish a couple last things that I really wanted off.
Um,
but essentially,
uh,
I had been wanting to,
for a while,
like add in things specifically towards like empire builder and like actually play around with it more,
um,
with a couple other of the basic mini apps that are out there.
So yeah,
I'm,
um,
I'm excited to see what we can do with it.
Um,
ads.
Like I,
I need people,
I need like actual ad space anyway.
Like the fact that we would have be creating the ads and the ad space and all this and being like involved in that.
I'm super about,
cause like,
I want to learn more about it.
Cause like,
I really like barely know about like,
even if I wanted to do web two ads,
web two ads,
but like,
I don't have,
I don't want to spend my money there anyways.
So yeah,
yeah,
yeah,
totally.
Totally.
So creating something that can be really valuable is like very easily valuable to be really cool.
So yeah,
I think it like,
it'd be really cool if you could create like simple snaps that like,
let people dive deeper into the context of that individual and that individual post and then create a comment based on that or a quote request,
a crew recast ideally.
So yeah.
Yeah.
So the thing that I'm trying to kind of at least get to a point of hardening,
which is not there yet is a little snippet or you can think of it as an SDK,
but it's really just a JavaScript snippet,
kind of like dropping Google analytics on your site,
you know,
just like put this in your header and it's got your little ID.
So you put that onto a website and then that would then,
you know,
say,
where do you want this snap to show up on your website?
Kind of like,
where do you want an ad to show up?
Is it the banners and the right now,
whatever.
So once you've got that kind of tag,
then it just kind of automatically populates based on a channel.
Yeah.
Like just like an embed,
like exactly like that.
Yeah.
But,
and this is where I'm going to like hit some of the snaps that you've created
because they show up in a web and you can click some buttons actually to
something.
So I'm going to see if that works.
It's kind of a next step.
Cause I got stuck using Nainar posted.
And the,
the protocol says you can't touch the buttons without a signature.
So every time someone touches the button,
it goes back to the,
Oh,
I just use hats for that.
Use hats.
Yeah.
H A A T Z.
It's one of the things that Cassie.
Oh yeah.
Yeah.
This is Cassie's thing.
Yeah.
Yeah.
But,
but,
but here's the issue.
It's the snap.
It's the snap protocol that says,
Oh,
when you build your snap,
you have to make this Jason object that has these fields in it.
And every time you get a post request on your server,
you have to verify a signature.
So,
you know,
who sent this post request and it's that verify that fails.
Your website does not because it's filtering.
It's saying,
I am on the web.
I don't have this signature.
So,
there's something like clever there that is necessary that.
So I'm going to see if I can get some of your snaps to show up in this
little,
this little widget,
this little embed,
uh,
as kind of my next step.
Um,
my host has called me.
I'll hop off with you.
And then just shoot me.
I'm always,
you got it,
man.
Cheers.
All right.
Later.
Bye.






Bye.
















Bye.
Bye.

!
Bye.
Bye.
Bye.
Bye.

Bye.

Bye.
Bye.












Bye.
Bye.












!
!

!
!
