angular.module('app', [])

// Push this to an Angular provided dependency so the WeaponData factory can access it
.value('ElementType',[
	{type:"",dur:0},
	{type:"Incendiary",name:"Burn",verb:"Ignite",dur:5},
	{type:"Shock",name:"Electrocute",verb:"shock",dur:2},
	{type:"Corrosive",name:"Corrosive",verb:"corrode",dur:8},
	{type:"Slag",name:"Slag",verb:"Slag",dur:8}
])

.factory('WeaponData', function($http, ElementType){
	return $http.get('weapon.json')
		// Here we update the elements before they ever leave the factory
		.then(function(data){
			data = data.data;
			for(i=0, len=data.length; i< len; i++){
				data[i].ele = ElementType[data[i].ele];
			}
			return data;
		});
})

.controller('BL2Ctrl', function($scope,ElementType,WeaponData) {

	WeaponData.then(function(data){
		$scope.weapons = data;
	});
})

.directive('weaponblock', function() {
	fireType = ["Semi-Auto","Automatic"];

	function semiCap(fireRate, fireType) {
		var rate = fireRate;

		if(fireType == "Semi-Auto") {
			if(rate > 5.4) {
				rate = 5.4;
			}
		}

		return rate;
	}

	function adjAcc(acc) {
		return acc/100;
	}

	return {
		restrict: 'AE',
		replace: true,
		controller: function($scope,ElementType){
			$scope.elementType = ElementType;
			$scope.fireType = fireType;

			$scope.spm = function(weapon) {
				var mag = Math.ceil(weapon.mag/weapon.rounds);
				var fireCycle = mag/semiCap(weapon.rate,weapon.fire);
				var cyclesMinute = 60/(fireCycle+parseFloat(weapon.reload));
				var fullCycles = Math.floor(cyclesMinute);
				var remaining = (cyclesMinute-fullCycles)*(fireCycle+parseFloat(weapon.reload));
				var partCycle = 0;

				if(fireCycle < remaining) {
					fullCycles++;
				} else {
					partCycle = Math.floor((remaining/fireCycle)*weapon.mag);
				}

				var spm = (mag*fullCycles)+parseFloat(partCycle);
	

				$scope.dps = function(weapon) {
					return (Math.floor((spm*weapon.dmgrnds)*adjAcc(weapon.acc))*weapon.dmg)/60;
				};

				$scope.eledmg = function(weapon) {
					var dmg = ((weapon.eledmg*weapon.ele.dur)*(spm*adjAcc(weapon.eleper)))/60;

					if (dmg > weapon.eledmg) {
						return weapon.eledmg;
					} else {
						return dmg;
					}
				};

				return spm;
			};

			$scope.totaldps = function(weapon) {
				return parseFloat($scope.eledmg(weapon)) + $scope.dps(weapon);
			};
		},
		scope: {
			weaponStats: '=info'
		},
		templateUrl:'weaponblock.html'
	};
});