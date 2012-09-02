/******* INITIATE CANVAS *******/

var ctx = document.getElementById('canvas1').getContext('2d');
ctx.canvas.width = document.body.offsetWidth;
ctx.canvas.height = document.body.offsetHeight; 

var ctxBg = document.getElementById('canvasBg').getContext('2d');
ctxBg.canvas.width = document.body.offsetWidth;
ctxBg.canvas.height = document.body.offsetHeight; 

/******* DEFINE MAIN VARIABLES *******/

// Sounds
if (navigator.appName != 'Microsoft Internet Explorer') {
	var synth = new SfxrSynth();
	
	// State change sound
	var stateChangeSound = new Audio();
	stateChangeSound.src = synth.getWave('2,,0.1173,,0.08,0.56,,0.32,,,,,,0.5406,,,,,0.4,,,0.1,,1');
	
	// Expanding sound
	var expandingSound = new Audio();
 	expandingSound.src = synth.getWave('2,0.27,1,,1,0.29,,0.06,,,,,,0.5092,,,,,1,,,,,0.6'); 
 	
 	// Finished sound
 	var finishedSound = new Audio();
 	finishedSound.src = synth.getWave('2,0.06,0.31,0.3329,0.4142,0.5103,,,,,,0.5606,0.5871,,,,,0.6799,0.77,,,,,1');
 	
 	// Game over sound
 	var gameOverSound = new Audio();
	gameOverSound.src = synth.getWave('2,0.06,0.31,0.3329,0.4142,0.5103,,,,,,-0.2199,0.5871,,,,,0.6799,0.77,,,,,1');

	// Collected sound
	var collectedSound = new Audio();
	collectedSound.src = synth.getWave('2,0.05,0.068,0.3554,0.3162,0.59,,,,,,0.3799,0.7,,,,,,0.99,,,,,1.3');
	
	// All collected sound
	var specialCollectedSound = new Audio();
	specialCollectedSound.src = synth.getWave('2,0.06,0.17,0.3329,0.46,0.55,,,,,,0.5606,0.5871,,,,,0.6799,0.77,,,,,0.7');
}
 
// Entity Attributes
var player = {
	speed: 180,
	x: 1,
	y: 1,
	expanding: false
};

var food = {
	allPieces: new Array(),
	minQuant: 2
};

var enemy = {
	allPieces: new Array(),
	minQuant: 2
};

// General Attributes
var alpha = 1;

// Level and Min Requirements
var levelCollected = 0;
var totalCollected = 0;
var score = 0;
var finalScore = 0;
var difficulty = 1;
var minRequired = 1;

// Utility 
var keysDown = new Array();
var currentMode = 'menu';
var canRelease = false;
var paused = false;

// Text
var text = new Array();
var headingHeight;

// Twitter link 
var twitterLinkURL = null;
var inLink = false;
var linkX = ctx.canvas.width / 2 - 120;
var linkY = ctx.canvas.height/2;
var linkHeight= 30;
var linkWidth = 250;

// Gradient
var bgGrad;

// Floating scores
var allFloatingWorth = new Array();
var floatingActive = false;
var floatingWorth = null;
var floatingWorthX = null;
var floatingWorthY = null;
var floatingWorthAlpha = 1;

// Border spike positions
var spikeX = 0;
var spikeY = 0;

// Tutorial
var instructionsOn = true;
var instruction = 1;


/******* KEY BINDINGS *******/

// Detect key down
addEventListener('keydown', function (e) {
		keysDown[e.keyCode] = true;
}, false);

// Detect key up
addEventListener('keyup', function (e) {
	delete keysDown[e.keyCode];
	// If player un-presses Space, function of next Space press changes
	if (e.keyCode === 32 && player.expanding) {
		canRelease = true;	
	}

	// If key released is W or S, resume normal speed
	else if (e.keyCode === 87 && currentMode === 'game' ||
			 e.keyCode === 83 && currentMode === 'game') {
		restoreSpeed(food.allPieces);
		restoreSpeed(enemy.allPieces);
	}
}, false);

// Check if mouse is hovering over Twitter link
function on_mousemove(ev) {
	var x, y;

	// Get the mouse position relative to the canvas element.
	if (ev.layerX || ev.layerX) { 
    	x = ev.layerX;
    	y = ev.layerY;
  	}
  	
  	x-=ctx.canvas.offsetLeft;
  	y-=ctx.canvas.offsetTop;
 
  	// If mouse is hovering over link...
	if(x>=linkX && x <= (linkX + linkWidth) &&
		y<=linkY && y>= (linkY-linkHeight)){
      	document.body.style.cursor = 'pointer';
      	inLink=true;
  	}
  	else{
    	document.body.style.cursor = '';
      	inLink=false;
 	}
}

// If player clicks on Twitter link
document.body.onclick = function() {
	if (currentMode === 'gameover') {
		// If player clicks on Twitter share link, go to URL
	  	if (inLink)  {
   			window.location = twitterLinkURL.toString();
  		}  		
	}
}

// SPACE functionality
document.body.onkeypress = function(e) {
	var key = (e.keyCode) ? e.keyCode : (e.which) ? e.which : (e.charCode) ? e.charCode : -1;
	
	if (key === 13 && currentMode !== 'menu') {
		console.log('paused? ' + paused);
		paused = !paused;
	}

	// If player is in a menu, SPACE changes game state
	if (key === 32 && ctx.globalAlpha >= 1 && currentMode !== 'game') {
		switch(currentMode) {
		case 'menu':
			stateChangeSound.play();
			player.expanding = false;
			resetBgColorstops();
			currentMode = 'game';
			alpha = 0;
			break;
		
		case 'finished':
			stateChangeSound.play();
			resetBgColorstops();
			// food.minQuant = food.allPieces.length + levelCollected * 2;
			// enemy.minQuant = Math.round(food.minQuant / 1.3);
			resetVariables();
			currentMode = 'game';
			break;
		
		case 'gameover':
			stateChangeSound.play();
			reset();
			break;
		}
	}
	
	// If in game mode, SPACE is used to start/stop expanding
	else if (key === 32 && currentMode === 'game' && !player.expanding) {
		expandingSound.play();
		player.expanding = true;
		if (instruction === 3) {
			instruction = 4;
		}
		
		else {
			instructionsOn = false;
		}
		canRelease = false;
 		allFloatingWorth.push({x: player.x, y: player.y, alpha: 1, type: 'note'});

	}
	
	else if (key === 32 && currentMode === 'game' && canRelease) {
		player.expanding = false;
		if (levelCollected >= minRequired) {
			resetBgColorstops();
			totalCollected += levelCollected;
			difficulty += 1;
			finalScore = finalScore + score;
			food.minQuant = (food.allPieces.length + levelCollected);
			enemy.minQuant = Math.floor(food.minQuant / 1.5);
			currentMode = 'finished';
			finishedSound.play();
			alpha = 0;	
		}
		
		else {
 			gameOverSound.play();
			resetVariables();
			if (instructionsOn) {
				instructionsOn = false;
			}
		}
		
		// Stop Expansion sound
		expandingSound.currentTime = 0;
		expandingSound.pause();
	}
	
}


/******* GAME RESET *******/
function reset() {	
	difficulty = 1;
	finalScore = 0;
	currentMode = 'menu';
	food.minQuant = 2;
	enemy.minQuant = 2;
	totalCollected = 0;
	twitterLinkURL = null;
	resetBgColorstops();
	resetVariables();
};

function resizeCanvas() {
	ctx.canvas.width  = document.body.offsetWidth;
	ctx.canvas.height = document.body.offsetHeight;
	ctxBg.canvas.width = ctx.canvas.width;
	ctxBg.canvas.height = ctx.canvas.height; 
	linkX = ctx.canvas.width / 2 - 120;
	linkY = ctx.canvas.height / 3.2 + 265;
	render();
};

function resetVariables() {
	if (difficulty !== 1 && instructionsOn) {
		instructionsOn = false;
	}
	levelCollected = 0;
	score = 0;
	player.radius = 20;
	player.x = ctx.canvas.width / 2;
	player.y = ctx.canvas.height / 2;
	player.expanding = false;
	food.allPieces.length = 0;
	enemy.allPieces.length = 0;
	minRequired = 0;
	alpha = 0;
	paused = false;
	allFloatingWorth.length = 0;
	generateOther(food);
	generateOther(enemy);
	resetPlayerColorstops();
};


/******* UPDATE *******/
function update(modifier) {
	// Trigger fade-in if alpha is set to 0
	if (alpha <= 1) {
		alpha += 0.05;
		ctx.globalAlpha = alpha;
	}
	
	// Trigger game functions	
	if (currentMode === 'game') {
		playerMovement(modifier);		
		radiusFluctuate(player,0.05);
		otherMovement(food.allPieces,modifier);
		otherMovement(enemy.allPieces,modifier);	
		wallCollision();
	}
};

function playerMovement(modifier) {
	// Player is able to move if they are not expandig
	if (!player.expanding) {
		if (38 in keysDown) { // Player holding up
			player.y -= player.speed * modifier;
			if (instruction === 2) {
				instruction++;
			}
		}
		if (40 in keysDown) { // Player holding down
			player.y += player.speed * modifier;
			if (instruction === 2) {
				instruction++;
			}
		}
		if (37 in keysDown) { // Player holding left
			player.x -= player.speed * modifier;
			if (instruction === 2) {
				instruction++;
			}
		}
		if (39 in keysDown) { // Player holding right
			player.x += player.speed * modifier;
			if (instruction === 2) {
				instruction++;
			}
		}
	}
	
	// Increase radius if SPACE is pressed
	if (player.expanding) {
		player.radius += 20 * modifier;
		
		// Is food touching? Only check this if expanding
		foodCollision();
		
		// Is enemy or wall touching? Only check this if expanding
		if (enemyCollision() || wallCollision()) {
			expandingSound.currentTime = 0;
			expandingSound.pause();
			alpha = 0;
 			gameOverSound.play();
			currentMode = 'gameover';	
			finalScore = finalScore + score;		
			resetBgColorstops();
			
			// Set Twitter link based on final score & level
			twitterLinkURL = 'https://twitter.com/intent/tweet?&text=I+just+reached+' + finalScore + '+points+over+' + difficulty + '+levels+in+KROOG!+' + '-+http://liza.io/KROOG+(cc+@Lazer)';
		}
	}
};


// Movement of red and blue bubbles
function otherMovement(other,modifier) {
	for (var i = 0; i < other.length; i++) {
		// If W is pressed, fast forward
 		if (87 in keysDown) {
 			other[i].speedX = other[i].maxSpeedX;
 			other[i].speedY = other[i].maxSpeedY;
			if (instruction === 1) {
				instruction++;
			}
 		}
 		
 		// If S is pressed rewind
 		else if (83 in keysDown) {
 			other[i].speedX =  -(other[i].maxSpeedX);
		 	other[i].speedY =  -(other[i].maxSpeedY);
			if (instruction === 1) {
				instruction++;
			}
 		}
 		
		other[i].x += other[i].speedX * modifier;
		other[i].y += other[i].speedY * modifier;
				
		// Keep this semi-transparent if the player is not expanding
		if (!player.expanding) {
			other[i].alpha = 0.65;
			radiusFluctuate(other[i],0.05);
		}
		
		// Fade in slowly if the player is expanding
		else {
			if (other[i].alpha < 1) {
				other[i].alpha += 0.01;
			}
		}	
 	}		
};

// Fluctuating radius
function radiusFluctuate(entity,speed) {
	// Make the entity's radius increase and decrease gradually
	if (entity.radius < entity.newRadius && !entity.expanded && !entity.expanding) {
		entity.radius += speed;
	}
	
	else if (entity.radius >=entity.newRadius && !entity.expanded && !entity.expanding) {
		entity.expanded = true;				
	}
	
	if (entity.radius > entity.newRadius - 3 && entity.expanded && !entity.expanding) {
		entity.radius -= speed;
	}
	
	else if (entity.radius <= entity.newRadius - 3) {
		entity.radius = entity.newRadius - 3;
		entity.expanded = false;
	}	
}

// Restore normal speed
function restoreSpeed(other) {
	for (var i = 0; i < other.length; i++) {
		other[i].speedX = other[i].maxSpeedX / 30;
		other[i].speedY = other[i].maxSpeedY / 30;
	}
};

/******* COLLISION DETECTION *******/

// Is player colliding with blue circle?
function foodCollision() {
	for (var i = 0; i < food.allPieces.length; i++) {
		var piece = food.allPieces[i];
		radiusFluctuate(piece,0.05);
		var dist = Math.sqrt(Math.pow(piece.x - player.x,2)+Math.pow(piece.y - player.y,2));
		
		if (dist<(piece.radius + player.radius)) {
			if (piece.alpha > 0.1) {
				piece.alpha -= 0.1;
			} 
			else {
				if (food.allPieces.length === 1 && piece.type === 'normal') {
					specialCollectedSound.play();
					piece.worth = piece.worth * 2;					
				}
				
				else {
					if (piece.type === 'bonusspecial') {
						specialCollectedSound.currentTime = 0;			
						specialCollectedSound.play();
						piece.worth = score * piece.special;
						piece.quantityWorth = levelCollected * piece.special;
					}
					else if (piece.type === 'minusMinReq') {
						specialCollectedSound.currentTime = 0;			
						specialCollectedSound.play();
						piece.worth = 0;
						piece.quantityWorth = 0;
						minRequired -= piece.special;
					}					
					else {
						collectedSound.currentTime = 0;			
						collectedSound.play();
					}
				}
				score += piece.worth;	
				allFloatingWorth.push({x: piece.x, y: piece.y, worth: piece.worth, quantityWorth: piece.quantityWorth, alpha: 1, type: piece.type, special: piece.special});
				food.allPieces.splice(i, 1);
				levelCollected += piece.quantityWorth;
				updatePlayerColorstops();
				
			}
		}
		
		// Blue bubbles are slowly attracted to play if they are close enough
		else if (dist < (piece.radius + player.radius + 10)) {
			if (player.x < piece.x) {
				piece.x -= 0.15;
			}
	
			else {
				piece.x += 0.15;
			}
			
			if (player.y < piece.y) {
				piece.y -= 0.15;
			}
			
			else {
				piece.y += 0.15;
			}		
		}
	}
};

// Is player colliding with red circle?
function enemyCollision() {
	for (var i = 0; i < enemy.allPieces.length; i++) {
		var piece = enemy.allPieces[i];
		var dist = Math.sqrt(Math.pow(enemy.allPieces[i].x - player.x,2)+Math.pow(enemy.allPieces[i].y - player.y,2));
		if (dist<(piece.radius + player.radius + 10)) {
			return true;	
		}
		
		if (dist < (piece.radius + player.radius + 50)) {
			radiusFluctuate(piece,0.3);
		}
		
		else {
			radiusFluctuate(piece,0.05);
		}
	}
};

// Is player colliding with edge of screen?
function wallCollision() {
	if (player.x - player.radius < 0 + 5) {
		player.x += player.radius - player.x + 5;
		if (player.expanding) {
			return true;
		}
	}
	
	else if (player.x + player.radius > ctx.canvas.width - 5) {
		player.x = ctx.canvas.width - player.radius - 5;
		if (player.expanding) {
			return true;
		}
	}
	
	if (player.y - player.radius < 0 + 5) {
		player.y += player.radius - player.y + 5;
		if (player.expanding) {
			return true;
		}
	}
	
	else if (player.y + player.radius > ctx.canvas.height - 5) {
		player.y = ctx.canvas.height - player.radius - 5;
		if (player.expanding) {
			return true;
		}
	}
};

/******* GENERATE BUBBLES *******/

function generateOther(other) {
	var quantity = randomFromTo(other.minQuant,0.5 * ctx.canvas.height / 100 + other.minQuant);
	for (var i = 1; i <= quantity; i++) {
		var speedX = ((Math.random() * 20) + 0) - 10;
		var speedY = ((Math.random() * 20) + 0) - 10;
		var maxSpeedX = speedX * 30;
		var maxSpeedY = speedY * 30;
		var radiusMax = 6 * ctx.canvas.height / 100 + difficulty;
		var radiusMin = 2 * ctx.canvas.height / 100 + 10 * difficulty / 100;
		var radius = randomFromTo(radiusMin, radiusMax);
		var newRadius = radius + 3;
		if (other === food) {
			var specialCalc = randomFromTo(0,5 * ctx.canvas.height / 100 - other.allPieces.length);
			var quantityWorth = 1;
			if (specialCalc === 0) {
				var type = 'bonusspecial';
				var special = Math.round(50 * radius / ctx.canvas.height);
				var worth = levelCollected * special;
				var note = '*' + special;
			}
			else if (specialCalc === 1 && difficulty > 3) {
				var type = 'minusMinReq';
				var special = Math.round(50 * radius / ctx.canvas.height);
				var worth = 0;
				var note = '-' + special + 'req';
			}
			else {
				var type = 'normal';
				var special = 0;
				var worth = Math.round(100 * radius / ctx.canvas.height);
				var note = worth;
			}
		}
		
		else {
			var type = 'normal';
			var note = null;
		}
		// var worth = Math.round((10 * radius) / 100);
		var x  = radius + (Math.random() * (ctx.canvas.width - radius * 2));
		var y  = radius + (Math.random() * (ctx.canvas.height - radius * 2));
		entity = {speedX: speedX, speedY: speedY, maxSpeedX: maxSpeedX, maxSpeedY: maxSpeedY, x: x, y: y, radius: radius, newRadius: newRadius, worth: worth, type: type, note: note, special: special, quantityWorth: quantityWorth};
		other.allPieces.push(entity);
	}
	
	// Minimum collection requirement for this level
	minRequired = Math.round(food.allPieces.length * 40 / 100);

};

/******* UTILITY FUNCTIONS *******/

// Update player colors if min requirement is reached
function updatePlayerColorstops() {
	if (levelCollected >= minRequired) {
		player.colorstop1 = bgGradStop2;
		player.colorstop2 = bgGradStop1;
	}
};

// Rest player colors
function resetPlayerColorstops() {
	player.colorstop1 = '#ababab';
	player.colorstop2 = '#949494';
};

// Set background gradient
function resetBgColorstops() {
	bgGradStop1 = '#'+('00000'+(Math.random()*16777216<<0).toString(13)).substr(-6);
	bgGradStop2 = '#'+('00000'+(Math.random()*16777216<<0).toString(13)).substr(-6);
};

// Generate random number in a range
function randomFromTo(minVal,maxVal,floatVal) {
  var randVal = minVal+(Math.random()*(maxVal-minVal));
  return typeof floatVal=='undefined'?Math.round(randVal):randVal.toFixed(floatVal);
};

function getAngle(ctx, x, y, angle, h) {
    var radians = angle * (Math.PI / 180);
    return { x: x + h * Math.cos(radians), y: y + h * Math.sin(radians) };
}

/******* DRAW EVERYTHING *******/
function render() {
	drawBg();
	ctx.clearRect(0,0,ctx.canvas.width,ctx.canvas.height);
	if (currentMode === 'menu') {
		drawMenuScreen();
	}
	
	else if (currentMode === 'game') {
		drawGameScreen();
	}

	else if (currentMode === 'finished') {
		drawFinishedScreen();
	}
	
	else if (currentMode === 'gameover') {
		drawGameOverScreen();

	}
	setText();
	if (paused) {
		menuKeys(ctx.canvas.height / 3.5, 1);
	}

};

function setText() {
	if (currentMode === 'finished' || currentMode === 'gameover') {
		ctx.textBaseline = 'top';
		ctx.fillStyle = "white";
		ctx.font = "normal 14px tahoma";
		ctx.textAlign = "left";
		ctx.textBaseline = "top";
		ctx.lineWidth = 1;	
		var lineY = 0;
		var lineX = ctx.canvas.width / 10;
		var lineHeight = 20;
	
		switch(currentMode) {				
			case 'finished':
				lineX = ctx.canvas.width / 2;
				lineY = headingHeight + 100;			
				ctx.textAlign = "center";
				ctx.font = "normal 19px tahoma";
				text = ['Collected ' + levelCollected + ' blue bubbles',
						'-----------------------------',
						'Total Score: ' + finalScore,
						'-----------------------------',
						'Next Level:  ' + difficulty,
						'',
						'SPACE to start next level'];
						
			break;
	
			case 'gameover':
				lineX = ctx.canvas.width / 2;
				lineY = headingHeight + 100;			
				ctx.font = "bold 22px tahoma";

				ctx.textAlign = "center";
				ctx.fillText('FINAL SCORE: ' + finalScore, ctx.canvas.width / 2, lineY);
				ctx.font = "normal 19px tahoma";
				text = ['',
						'-----------------------------',
						'Total Collected:  ' + totalCollected,
						'Level Reached: ' + difficulty,
						'-----------------------------',
						'SPACE to play again',
						'',
						'   Tweet your score!'];
		}

		for (var i = 0; i < text.length; i++) {
			ctx.fillText(text[i], lineX, lineY);
			lineY += lineHeight;			
		}
	}

};

function drawBg() {
  	bgGrad = ctxBg.createRadialGradient(ctxBg.canvas.width / 2, ctxBg.canvas.height / 2, 0, ctxBg.canvas.width / 2, ctxBg.canvas.height / 2, ctxBg.canvas.width / 2);
    bgGrad.addColorStop(0, bgGradStop1);
	bgGrad.addColorStop(1, bgGradStop2);
    ctxBg.fillStyle = bgGrad;
    ctxBg.fillRect(0, 0, ctxBg.canvas.width, ctxBg.canvas.height);
}

function drawMenuScreen() {
	ctx.fillStyle = "white";
	ctx.font = "bold 110px Helvetica";
	ctx.textAlign = 'center';
	ctx.textBaseline = "top";
	text = 'KROOG';
	headingHeight = ctx.canvas.height/20;
	ctx.fillText(text, ctx.canvas.width / 2, headingHeight);    
	menuBlue();
	menuRed();
	menuGold();
	menuKeys(headingHeight + 330, 0.65);
}

function drawGameScreen() {
	drawSpikes();
	drawPlayer();
	drawLevelText();
	drawAllOther();
	drawFloatingWorth();
	if (instructionsOn) {
		drawGameInstructions();
	}
};

function drawGameInstructions() {
	var y = ctx.canvas.height / 8;
	ctxBg.fillStyle = 'rgba(0,0,0,0.5)';
	ctxBg.fillRect( ctx.canvas.width / 2 - 295, y - 73, 600, 145);
	ctxBg.fill();
	ctxBg.textAlign = 'center';
	ctxBg.font = 'bold 35px Helvetica';
	ctxBg.fillStyle = 'rgba(255,255,255,0.9)';
	switch (instruction) {
		case 1:
			ctxBg.fillText('Hold W/S to fast forward/rewind', ctx.canvas.width/2, y - 10);
			ctxBg.font = 'bold 23px Helvetica';
			ctxBg.fillText('(Get a feel for the movement)', ctx.canvas.width/2, y + 28);

			break;
		case 2: 
			ctxBg.fillText('Move with the ARROW KEYS', ctx.canvas.width/2, y - 10);
			ctxBg.font = 'bold 22px Helvetica';
			ctxBg.fillText('Find the best location to pick up blue bubbles', ctx.canvas.width/2, y + 18);
			ctxBg.font = 'bold 14px Helvetica';
			ctxBg.fillText("(Don't worry, spiky bubbles don't become deadly until you start expanding)", ctx.canvas.width/2, y + 41);
			break;
		case 3:
			ctxBg.fillText('When ready, press SPACE', ctx.canvas.width/2, y - 15);
			ctxBg.font = 'bold 23px Helvetica';
			ctxBg.fillText('To start expanding and collecting bubbles', ctx.canvas.width/2, y + 13);
			ctxBg.font = 'bold 15px Helvetica';
			ctxBg.fillText("You can't move while expanding, but you CAN fast forward/rewind", ctx.canvas.width/2, y + 36);
			break;
		case 4:
			ctxBg.font = 'bold 34px Helvetica';
			ctxBg.fillText('Press SPACE again to finish level!', ctx.canvas.width/2, y - 15);
			ctxBg.font = 'bold 25px Helvetica';
			ctxBg.fillText('Before you run into an edge or spiky bubble', ctx.canvas.width/2, y + 13);
			ctxBg.font = 'bold 20px Helvetica';
			ctxBg.fillText("If you haven't collected enough bubbles, the level restarts!", ctx.canvas.width/2, y + 36);
			break;
	}
};

function drawFinishedScreen() {
	ctx.font = 'bold 55px Helvetica';
	ctx.textAlign = 'center';
	ctx.fillStyle = 'white';
	ctx.textBaseline = 'top';	headingHeight = ctx.canvas.height / 3.2
	ctx.fillText('LEVEL COMPLETE', ctx.canvas.width / 2, headingHeight);
};

function drawGameOverScreen() {
	var lineX = ctx.canvas.width / 3.5;
	var lineHeight = 15;
	ctx.textAlign = 'center';
	ctx.fillStyle = 'white';
	ctx.textBaseline = 'top';
	ctx.canvas.addEventListener('mousemove', on_mousemove, false);
	ctx.font = 'bold 55px Helvetica';
	headingHeight = ctx.canvas.height / 3.2;
	ctx.fillText('GAME OVER', ctx.canvas.width / 2, headingHeight);
	drawTwitterBird();
};
function drawSpikes() {
	ctxBg.fillStyle = 'rgba(255,0,0,1)';
	spikeX = 0;
	spikeY = 0;		
	ctxBg.beginPath();
	for (var i = 0; i < ctxBg.canvas.width / 30; i++) {
		ctxBg.moveTo(spikeX,spikeY);
		ctxBg.lineTo(spikeX + 10, spikeY + 7);
		ctxBg.lineTo(spikeX + 20, spikeY);
		spikeX += 30;
	}
	
	spikeX = 0;
	spikeY = ctx.canvas.height;
	for (var i = 0; i < ctxBg.canvas.width / 30; i++) {
		ctxBg.moveTo(spikeX,spikeY);
		ctxBg.lineTo(spikeX + 10, spikeY - 7);
		ctxBg.lineTo(spikeX + 20, spikeY);
		spikeX += 30;
	}
	
	spikeX = 0;
	spikeY = 0;
	for (var i = 0; i < ctxBg.canvas.height / 30; i++) {
		ctxBg.moveTo(spikeX,spikeY);
		ctxBg.lineTo(spikeX + 7, spikeY + 10);
		ctxBg.lineTo(spikeX, spikeY + 20);
		spikeY += 30;
	}
	
	spikeX = ctx.canvas.width;
	spikeY = 0;
	for (var i = 0; i < ctxBg.canvas.height / 30; i++) {
		ctxBg.moveTo(spikeX,spikeY);
		ctxBg.lineTo(spikeX - 7, spikeY + 10);
		ctxBg.lineTo(spikeX, spikeY + 20);
		spikeY += 30;
	}
	ctxBg.fill(); 
};

function drawLevelText() {
	ctx.textBaseline = 'top';
	ctx.textAlign = 'left';

	ctx.fillStyle = 'rgba(255,255,255,0.9)';
	ctx.font = 'bold 17px tahoma';
	ctx.fillText('Collect at least ' + minRequired + ' blue bubbles!', 10, 7);

	ctx.fillStyle='rgba(255,255,255,0.6)';
	ctx.fillText('ENTER to view controls', 10, 27);

	ctx.textAlign = 'right';
	ctx.fillStyle = 'rgba(255,255,255,0.9)';
	ctx.fillText('Level: ' + difficulty, ctx.canvas.width - 10, 7);
	ctx.fillText('Level Score: ' + score, ctx.canvas.width - 10, 27);
}

function drawPlayer() {
	var playergrad = ctx.createRadialGradient(player.x, player.y, 0, player.x, player.y, player.radius);
	playergrad.addColorStop(0.25, player.colorstop1);
	playergrad.addColorStop(0.9, player.colorstop2);
	
	ctx.fillStyle = playergrad;
	ctx.beginPath();
	ctx.arc(player.x, player.y, player.radius, 0 , 2 * Math.PI, true);
	ctx.closePath();
	ctx.fill();
	
	ctx.strokeStyle = '#ffffff';
	ctx.stroke();
	
	// Level Score, displayed inside player
	ctx.fillStyle = 'rgba(255, 255, 255, 1)';
	ctx.font = '21px Helvetica';
	ctx.textBaseline = 'middle';
	ctx.textAlign = 'center';
	ctx.fillText(levelCollected + '/' + minRequired, player.x, player.y);
}

function drawAllOther() {
	// Draw all blue circles
	ctx.fillStyle = 'rgba(255,255,255, 0.5)';
	ctx.font = '17px Helvetica';
	ctx.textBaseline = 'middle';
	ctx.textAlign = 'center';
	ctx.lineWidth = 1;
	for (var i = 0; i < food.allPieces.length; i++) {
		var piece = food.allPieces[i];			
		ctx.save();
		var radgrad = ctx.createRadialGradient(food.allPieces[i].x - 5, piece.y + 5, 0, piece.x - 5, piece.y + 5, piece.radius);
		if (piece.type === 'normal') {
			radgrad.addColorStop(0, 'rgba(25, 133, 255,' + piece.alpha +')');
			radgrad.addColorStop(0.75, 'rgba(2, 91, 191,' + piece.alpha +')');
			radgrad.addColorStop(1, 'rgba(5, 79, 162,' + piece.alpha +')');
			ctx.strokeStyle = 'rgba(2, 32, 86,' + piece.alpha +')';
		}
		
		else if (piece.type === 'bonusspecial' || piece.type === 'minusMinReq') {
			radgrad.addColorStop(0, 'rgba(255, 204, 0,' + piece.alpha +')');
			radgrad.addColorStop(0.75, 'rgba(233, 186, 0,' + piece.alpha +')');
			radgrad.addColorStop(1, 'rgba(204, 135, 0,' + piece.alpha +')');
			ctx.strokeStyle = 'rgba(171, 121, 0,' + piece.alpha +')';
		}
		
		ctx.fillStyle = radgrad;
		ctx.beginPath();
		ctx.arc(piece.x, piece.y, piece.radius, 0 , 2 * Math.PI, true);
		ctx.fill();
		ctx.stroke();
		ctx.restore();
		ctx.fillText(piece.note, piece.x, piece.y);
	}
	// Draw all red circles
	ctx.lineWidth = 3;
	var rotation = 20*Math.PI/180;
	ctx.strokeStyle = 'rgba(126,0,0,1)';
	for (var i = 0; i < enemy.allPieces.length; i++) {
		ctx.beginPath();
		var piece = enemy.allPieces[i];	
				
		// Draw spikes
		for (var n = 0; n < 14; n++) {
			var pos = getAngle(ctx, piece.x, piece.y, rotation, piece.radius);
			ctx.moveTo(pos.x, pos.y);
			pos = getAngle(ctx, piece.x, piece.y, rotation, piece.radius + 10);
			ctx.lineTo(pos.x, pos.y);
			ctx.stroke();
			rotation += 26;
		}

		ctx.save();
		ctx.lineWidth = 1;
		ctx.beginPath();
		var radgrad = ctx.createRadialGradient(piece.x - 5, piece.y + 5, 0, piece.x - 5, piece.y + 5, piece.radius);
		radgrad.addColorStop(0, 'rgba(255, 48, 0,' + piece.alpha +')');
		radgrad.addColorStop(0.75, 'rgba(201, 24, 0,' + piece.alpha +')');
		radgrad.addColorStop(1, 'rgba(172, 21, 1,' + piece.alpha +')');
		ctx.fillStyle = radgrad;
		ctx.arc(piece.x, piece.y, piece.radius, 0 , 2 * Math.PI, true);
		ctx.fill();
		ctx.stroke();
		ctx.restore();
	}
};

function drawFloatingWorth(type) {
	ctx.font = 'normal 18px Helvetica';
	for (var i = 0; i < allFloatingWorth.length; i++) {
		var piece = allFloatingWorth[i];
		if (piece.alpha > 0) {
			ctx.fillStyle = 'rgba(255,255,255,' + piece.alpha + ')';
			piece.y -= 1;
			piece.alpha -= 0.01;
			if (food.allPieces.length > 0) {
				if (piece.type === 'bonusspecial') {
					ctx.fillText('+' + piece.worth + ' points!', piece.x, piece.y);
					ctx.fillText('+' + piece.quantityWorth + ' collected!', piece.x, piece.y + 20);
				}
				
				else if (piece.type === 'minusMinReq') {
					ctx.fillText('-' + piece.special + ' bubbles required!', piece.x, piece.y);
				}
				
				else if (piece.type === 'note') {
					ctx.fillText('Press SPACE again to finish level!', piece.x, piece.y);
				}
				else {
					ctx.fillText('+' + piece.worth + ' points!', piece.x, piece.y);
				}
			}
			
			else {
				ctx.fillText('+' + piece.worth + ' points! (x2 CLEAR BONUS!)', piece.x, piece.y);
			}
		}
		else {
			allFloatingWorth.splice(i, 1);
		}	
	}
}

function drawTwitterBird() {
	var x = ctx.canvas.width / 2 - 110;
	var y = headingHeight + 240;
	var radius = 25;
	var startAngle = (Math.PI / 180) * 15;
	var endAngle   = (Math.PI / 180) * 130;
	var anticlockwise = false;
	ctx.fillStyle = '#00aced';
	ctx.strokeStyle = '#00aced';
	ctx.beginPath();
	ctx.arc(x, y, radius, startAngle, endAngle, anticlockwise);
	
	x = x + 15;
	y = y + 2;
	radius = 10;
	startAngle = 0;
	endAngle   = 2 * Math.PI;
	
	ctx.arc(x, y, radius, startAngle, endAngle, anticlockwise);
	ctx.fill();
	
	x = x - 32;
	y = y - 5;
	radius = 22;
	startAngle = (Math.PI / 180) * 15;
	endAngle   = (Math.PI / 180) * 95;
	
	ctx.arc(x, y, radius, startAngle, endAngle, anticlockwise);
	
	ctx.moveTo(x + 37,y - 4);
	ctx.lineTo(x + 45,y - 7);
	ctx.lineTo(x + 37,y + 1);
	ctx.lineTo(x + 48,y);
	ctx.lineTo(x + 37,y + 8);
	ctx.fill();
	
	var fromX = x + 20;
	var fromY = y + 8;
	var toX   = x + 2;
	var toY   = y - 5;
	var cpX   = x + 7;
	var cpY   = y + 3;
	
	ctx.moveTo(fromX, fromY);
	ctx.quadraticCurveTo(cpX, cpY, toX, toY);
	ctx.quadraticCurveTo(cpX - 3,cpY + 5,toX + 7, toY + 13);
	ctx.quadraticCurveTo(cpX - 3, cpY + 5,toX - 3,toY + 7);
	ctx.quadraticCurveTo(cpX - 5, cpY + 8,toX + 3,toY + 15);
	ctx.quadraticCurveTo(cpX - 6, cpY + 10,toX - 4,toY + 14);
	ctx.quadraticCurveTo(cpX - 5, cpY + 15,toX + 10,toY + 23);
	ctx.stroke();
	ctx.fill();
	ctx.closePath();
};

function menuBlue() {
	ctx.save();
	ctx.beginPath();
	
	// BLUE 
	ctx.fillStyle = 'rgba(25, 133, 255, 1)';
	ctx.arc(ctx.canvas.width/2, headingHeight + 150, 30, 0 , 2 * Math.PI, true);
	ctx.fill();
	
	ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
	ctx.font = '25px Helvetica';
	ctx.textBaseline = 'middle';
	ctx.textAlign = 'center';
	ctx.fillText(3, ctx.canvas.width/2, headingHeight + 150);
	ctx.strokeStyle = 'rgba(255,255,255,0.6)';

	// TEXT
	ctx.moveTo(ctx.canvas.width / 1.95,headingHeight + 150);
	ctx.lineTo(ctx.canvas.width / 1.95 + 30,headingHeight + 150);

	ctx.moveTo(ctx.canvas.width / 2.1, headingHeight + 120);
	ctx.lineTo(ctx.canvas.width / 2.1 - 20,headingHeight + 120);
	ctx.lineTo(ctx.canvas.width / 2.1 - 20,headingHeight + 180);
	ctx.lineTo(ctx.canvas.width / 2.1, headingHeight + 180);
	
	ctx.moveTo(ctx.canvas.width / 2.1 - 20, headingHeight + 150);
	ctx.lineTo(ctx.canvas.width / 2.1 - 50, headingHeight + 150);
	
	ctx.stroke();
	ctx.closePath();
	
	ctx.font = '13px Helvetica';
	ctx.textAlign = 'left';
	ctx.fillText('Points for this bubble!', ctx.canvas.width / 1.95 + 33,headingHeight + 150);
	ctx.textAlign = 'right';
	ctx.fillText('EXPAND TO EAT ME!', ctx.canvas.width / 2.1 - 52,headingHeight + 150);
	
	ctx.restore();
};

function menuRed() {
	ctx.save();
	var rotation = 20*Math.PI/180;
	ctx.beginPath();
	 for (var n = 0; n < 14; n++) {
		ctx.strokeStyle = 'rgba(172, 21, 1,1)';
		ctx.lineWidth = 3;
		var pos = getAngle(ctx, ctx.canvas.width / 2, headingHeight + 225, rotation, 20 );
		ctx.moveTo(pos.x, pos.y);
		var pos = getAngle(ctx, ctx.canvas.width / 2, headingHeight + 225, rotation, 20 + 10 );
		ctx.lineTo(pos.x, pos.y);
		ctx.stroke();
		rotation += 26;
	} 
	ctx.lineWidth = 1;
	ctx.fillStyle = 'rgba(255, 48, 0, 1)';
	ctx.beginPath();
	ctx.arc(ctx.canvas.width / 2, headingHeight + 225, 20, 0 , 2 * Math.PI, true);
	ctx.fill();
	ctx.strokeStyle = 'rgba(255,255,255,0.6)';
	
	ctx.moveTo(ctx.canvas.width / 1.95,headingHeight + 225);
	ctx.lineTo(ctx.canvas.width / 1.95 + 30,headingHeight + 225);

	ctx.moveTo(ctx.canvas.width / 2.1, headingHeight + 195);
	ctx.lineTo(ctx.canvas.width / 2.1 - 20,headingHeight + 195);
	ctx.lineTo(ctx.canvas.width / 2.1 - 20,headingHeight + 255);
	ctx.lineTo(ctx.canvas.width / 2.1, headingHeight + 255);
	
	ctx.moveTo(ctx.canvas.width / 2.1 - 20, headingHeight + 225);
	ctx.lineTo(ctx.canvas.width / 2.1 - 50, headingHeight + 225);
	ctx.stroke();
	
	ctx.fillStyle = 'rgba(255,255,255,0.6)';
	ctx.font = '13px Helvetica';
	ctx.textBaseline = 'middle';
	ctx.textAlign = 'left';
	ctx.fillText('No bonus points! Only doom!', ctx.canvas.width / 1.95 + 33,headingHeight + 225);
	ctx.textAlign = 'right';
	ctx.fillText('AVOID AT ALL COSTS!', ctx.canvas.width / 2.1 - 52,headingHeight + 225);

	ctx.restore();
};

function menuGold() {
	ctx.save();
	ctx.beginPath();
	
	// BLUE 
	ctx.fillStyle = 'rgba(255, 162, 0, 1)';
	ctx.arc(ctx.canvas.width/2, headingHeight + 290, 20, 0 , 2 * Math.PI, true);
	ctx.fill();
	
	ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
	ctx.font = '25px Helvetica';
	ctx.textBaseline = 'middle';
	ctx.textAlign = 'center';
	ctx.fillText('*2', ctx.canvas.width/2, headingHeight + 290);
	ctx.strokeStyle = 'rgba(255,255,255,0.6)';

	// TEXT
	ctx.moveTo(ctx.canvas.width / 1.935, headingHeight + 290);
	ctx.lineTo(ctx.canvas.width / 1.935 + 30, headingHeight + 290);

	ctx.moveTo(ctx.canvas.width / 2.1, headingHeight + 270);
	ctx.lineTo(ctx.canvas.width / 2.1 - 20, headingHeight + 270);
	ctx.lineTo(ctx.canvas.width / 2.1 - 20, headingHeight + 310);
	ctx.lineTo(ctx.canvas.width / 2.1, headingHeight + 310);
	
	ctx.moveTo(ctx.canvas.width / 2.1 - 20, headingHeight + 290);
	ctx.lineTo(ctx.canvas.width / 2.1 - 50, headingHeight + 290);
	
	ctx.stroke();
	ctx.closePath();
	
	ctx.font = '13px Helvetica';
	ctx.textAlign = 'left';
	ctx.fillText('Special bonus. Always good!', ctx.canvas.width / 1.95 + 33,headingHeight + 290);
	ctx.textAlign = 'right';
	ctx.fillText('RARE GOLDEN BUBBLE!', ctx.canvas.width / 2.1 - 52,headingHeight + 290);
	
	ctx.restore();
};


function menuKeys(y,alpha){
	ctx.fillStyle='rgba(255,255,255,0.5)';
	ctx.textBaseline="middle";
	ctx.textAlign="center";
	ctx.font = 'bold 25px Helvetica';
	if (paused) {
		ctx.save();
		ctx.fillStyle = 'rgba(0,0,0,0.9)';
		ctx.fillRect( ctx.canvas.width / 2 - 175, y - 15, 460, 315);
		ctx.restore();

		ctx.fillText('ENTER to close', ctx.canvas.width/2, y + 270);
	}
	
	else {
		ctx.fillText('SPACE to START', ctx.canvas.width/2, y + 270);
	}
	ctx.font = '15px Helvetica';
	ctx.fillText('Move', ctx.canvas.width / 2 - 67, y + 110);
	ctx.fillText('Fast Forward Bubbles', ctx.canvas.width / 2 + 193, y + 23);
	ctx.fillText('Rewind Bubbles', ctx.canvas.width / 2 + 173, y + 73);
	ctx.fillText('Press ONCE to START EXPANDING', ctx.canvas.width / 2, y + 205);
	ctx.fillText('Press AGAIN to FINISH LEVEL before you die', ctx.canvas.width / 2, y + 220);
	ctx.fillText('Double tap to RETRY level', ctx.canvas.width/2, y + 235);


	ctx.fillStyle = 'rgba(255,255,255,' + alpha + ')';
	ctx.fillRect(ctx.canvas.width/2 - 90, y,45,45);
	ctx.fillRect(ctx.canvas.width/2 - 140, y + 50,45,45);
	ctx.fillRect(ctx.canvas.width/2 - 90, y + 50,45,45);
	ctx.fillRect(ctx.canvas.width/2 - 40, y + 50,45,45);

	ctx.fillRect(ctx.canvas.width/2 + 40, y,45,45);
	ctx.fillRect(ctx.canvas.width/2 + 50, y + 50,45,45);

	ctx.fillRect(ctx.canvas.width/2 - 140, y + 141,275,45);
	
	ctx.strokeStyle = 'rgba(255,255,255,0.5)';
	ctx.strokeRect(ctx.canvas.width / 2 - 145, y + 136, 285,55);

	ctx.beginPath();
	ctx.moveTo(ctx.canvas.width/2 + 85, y + 23);
	ctx.lineTo(ctx.canvas.width/2 + 120, y + 23);
	ctx.moveTo(ctx.canvas.width/2 + 95, y + 73);
	ctx.lineTo(ctx.canvas.width/2 + 120, y + 73);
	ctx.stroke();

	ctx.fillStyle='rgba(73,73,73,1)';
	ctx.font = '20px Helvetica';
	ctx.fillText('^', ctx.canvas.width/2 - 68, y + 25);
	ctx.fillText('<', ctx.canvas.width/2 - 118, y + 73);
	ctx.fillText('v', ctx.canvas.width/2 - 67, y + 73);
	ctx.fillText('>', ctx.canvas.width/2 - 17, y + 73);

	ctx.fillText('W', ctx.canvas.width/2 + 63, y + 25);
	ctx.fillText('S', ctx.canvas.width/2 + 73, y + 73);
	ctx.fillText('SPACE', ctx.canvas.width/2, y + 165);
	
}

// Game loop
function main() {
	var now = Date.now();
	var delta = now - then;
	update(delta / 1000);
	render();
	then = now;
	
};

// Play
reset();

var then = Date.now();
resizeCanvas();
window.addEventListener('resize', resizeCanvas, false);
setInterval(main, 1); // Execute as fast as possible