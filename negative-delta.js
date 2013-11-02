var perfect = 'cubic-bezier(0.5, 0.0, 0.5, 1.0)';

function getProperty(f) {
    var e = document.documentElement;
    for (var i=0; i<f.length; i++) {
        if (f[i] in e.style) {
            return f[i];
        }
    }
}

var prefixedTransform = getProperty(['transform', 'WebkitTransform', 'MozTransform', 'msTransform', 'OTransform']);

function animationCount(element) {
	return element.getCurrentAnimations().length;
}

function scientificToDecimal(n) {
	return Number(n).toFixed(4);
}

function isArray(o) {
	return Object.prototype.toString.call(o) === '[object Array]';
}

function copyAnimationsFromOldElementToNewElement(oldElement,newElement) {
	var oldAnimations = oldElement.getCurrentAnimations();
	var length = oldAnimations.length
	for (var i=0; i<length; i++) {
		var oldAnimation = oldAnimations[i];
		var newEffect = oldAnimation.effect.clone();
		var oldTiming = oldAnimation.specified._dict; // !!!
		if (oldTiming === null || oldTiming === undefined) console.log('oldAnimation.specified._dict has broken');
		if (oldAnimation._player === null || oldAnimation._player === undefined) console.log('oldAnimation._player has broken');
		var newTiming = JSON.parse(JSON.stringify(oldTiming));
		newTiming.delay = ((oldAnimation._player.startTime + oldTiming.delay) - document.timeline.currentTime); // !!!
		newElement.animate(newEffect,newTiming);
	}
}

function underlyingValueAnimation(element,type,unit) {
	var declaredArgsCount = 3;
	var varArgsCount = arguments.length-declaredArgsCount;
    var theAnimation = null;
    var args = null;
	if (varArgsCount > 0) {
		args = arguments[declaredArgsCount];
		if (!isArray(args)) {
			args = [];
			for (var i = declaredArgsCount; i<arguments.length; i++) {
				args[i-declaredArgsCount] = arguments[i];
			}
		}
		theAnimation = constantAnimation(element,type,unit,'replace',args);
	}
	return theAnimation;
}

function constantAnimation(element,type,unit,operation) {
	var declaredArgsCount = 4;
	var varArgsCount = arguments.length-declaredArgsCount;
    var theAnimation = null;
	if (varArgsCount > 0) {
		var animationDuration = 0;
		var animationFill = 'both';
		args = arguments[declaredArgsCount];
		if (!isArray(args)) {
			args = [];
			for (var i = declaredArgsCount; i<arguments.length; i++) {
				args[i-declaredArgsCount] = arguments[i];
			}
		}
		var theKeyframes = underlyingValueKeyframes(type,unit,args);
		var theEffect = new KeyframeAnimationEffect(theKeyframes, operation);
		var theDelay = document.timeline.currentTime;
		var theTiming = { duration : animationDuration, fill : animationFill, delay:theDelay};
		theAnimation = new Animation(element, theEffect, theTiming);
	}
	return theAnimation;
}

function underlyingValueKeyframes(type,unit) {
	var declaredArgsCount = 2;
    var varArgsCount = arguments.length-declaredArgsCount;
    var keyframes = [];
    var args = null;
	if (varArgsCount > 0) {
		args = arguments[declaredArgsCount];
		if (!isArray(args)) {
			args = [];
			for (var i = declaredArgsCount; i<arguments.length; i++) {
				args[i-declaredArgsCount] = arguments[i];
			}
		}
		if (unit === null || unit === undefined || unit === false) unit = "";
		var isScale = (type.substr(0,5) == 'scale');
		var isRotate = (type.substr(0,6) == 'rotate');
		var isTranslate = (type.substr(0,9) == 'translate');
		var isMatrix = (type.substr(0,6) == 'matrix');
		var isTransform = (isScale || isRotate || isTranslate || isMatrix);
		var name = (isTransform) ? 'transform' : type;
		var divider = (isTransform) ? "," : " ";
		var steps = 2;
		for (var i=0;i<steps;i++) {
			keyframes[i] = {'offset':i};
			keyframes[i][name] = (isTransform) ? type+'(' : '';
			for (var j = 0; j<args.length; j++) {
				if (j > 0) keyframes[i][name] += divider;
				keyframes[i][name] += scientificToDecimal(args[j])+unit;
			}
			if (isTransform) keyframes[i][name] += ')';	
		}
    }
    return keyframes;
}

function negativeDeltaAnimation(element,type,unit,duration,steps,omega,zeta) {
	var declaredArgsCount = 7;
	var varArgsCount = arguments.length-declaredArgsCount;
    var args = null;
	if (varArgsCount > 1) {
		args = [];
		for (var i = declaredArgsCount; i<arguments.length; i++) {
			args[i-declaredArgsCount] = arguments[i];
		}
	} else if (varArgsCount > 0) args = arguments[declaredArgsCount];
	var theEffect = negativeDeltaEffect(type,unit,steps,omega,zeta,args);
	var theTiming = {duration:duration, easing:perfect, fill:'backwards'};
	var theAnimation = new Animation(element, theEffect, theTiming);
	return theAnimation
}

function negativeDeltaEffect(type,unit,steps,omega,zeta) {
    var declaredArgsCount = 5;
    var varArgsCount = arguments.length-declaredArgsCount;
    var args = null;
	if (varArgsCount > 1) {
		args = [];
		for (var i = declaredArgsCount; i<arguments.length; i++) {
			args[i-declaredArgsCount] = arguments[i];
		}
	} else if (varArgsCount > 0) args = arguments[declaredArgsCount];
	var theKeyframes = negativeDeltaKeyframes(type,unit,steps,omega,zeta,args);
    return new KeyframeAnimationEffect(theKeyframes,'add');
}

function negativeDeltaKeyframes(type,unit,steps,omega,zeta) {
    var declaredArgsCount = 5;
    var varArgsCount = arguments.length-declaredArgsCount;
	var theKeyframes = [];
	function keyframeString(old,nu,progress) { // scale is the reason why I have to pass old and new values in all functions instead of just the delta
    	if (isScale) return scientificToDecimal(((progress * (old-nu)) + nu) / nu) + unit;
    	return scientificToDecimal((progress * (old-nu))) + unit;
	}
	var args = null;
	if (varArgsCount > 1) {
		args = [];
		for (var i = declaredArgsCount; i<arguments.length; i++) {
			args[i-declaredArgsCount] = arguments[i];
		}
	} else if (varArgsCount > 0) args = arguments[declaredArgsCount];
	if (isArray(args) && args.length > 1) {
		if (unit === null || unit === undefined || unit === false) unit = "";
		var isScale = (type.substr(0,5) == 'scale');
		var isRotate = (type.substr(0,6) == 'rotate');
		var isTranslate = (type.substr(0,9) == 'translate');
		var isMatrix = (type.substr(0,6) == 'matrix');
		var isTransform = (isScale || isRotate || isTranslate || isMatrix);
		var name = (isTransform) ? 'transform' : type;
		var divider = (isTransform) ? ", " : " ";
		var secondOrder = true;
		if (omega === false || omega === null || omega === undefined || zeta === false || zeta === null || zeta === undefined || steps === false || steps === null || steps === undefined || steps < 2) {
			secondOrder = false;
			steps = 2;
		}
		for (var i=0;i<steps;i++) {
			var offset = scientificToDecimal( (1.0/(steps-1))*i ) * 1.0; // offset from 0 to 1 inclusive // last * 1.0 is to prevent "0.0000" as a string
			if (i == steps-1) offset = 1.0; // prevent float error?
			var progress = 1.0 - offset; // or 0.0 if spring/bounce is required
			if (secondOrder && i < steps-1) progress = secondOrderResponse(omega,zeta,offset); // from 1 to 0 but will go negative briefly.
			theKeyframes[i] = {'offset':offset};
			theKeyframes[i][name] = (isTransform) ? type+'(' : '';
			for (var j = 0; j<args.length; j+=2) {
				if (j > 0) theKeyframes[i][name] += divider;
				theKeyframes[i][name] += keyframeString(args[j],args[j+1],progress);
			}
			if (isTransform) theKeyframes[i][name] += ')';	
		}
    }
    return theKeyframes;
}

function secondOrderResponse(omega,zeta,position) {
	if (zeta < 0 || zeta > 1) console.log('zeta should be between 0 and 1');
	omega *= 1.0;
	zeta *= 1.0;
	position *= 1.0;
	//  http://www.cocoawithlove.com/2008/09/parametric-acceleration-curves-in-core.html
	//  Matt Gallagher graciously offered the non-exclusive right to use the following code from the CocoaWithLove AnimationAcceleration project without attribution:
    	var beta = Math.sqrt(1.0 - zeta * zeta);
    	var value = 1.0 / beta * Math.exp(-zeta * omega * position) * Math.sin(beta * omega * position + Math.atan(beta / zeta));
	return value;
}
