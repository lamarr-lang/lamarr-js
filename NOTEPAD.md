{

	"nodes": {
		"vez": {
			"description": [ "Jsi ve vezi", "Jsi ve vezi a je ti zima", "Jsi ve vezi a nic nevidis" ],
			"image": "vez.jpg",
			"items": [ "klic", "vlasy", "podprsenka" ],
			"edges": {
				"vstup": {
					"description": [ "Po schodech dolu" ]
				},
				"zahrada": {
					"description": [ "Vyskocit z okna" ],
					"modifier": [ "smrtlenySkok" ]
				}
			},
			"properties": {
				"visits": 0
			},
			"events": {
				"enter": [ "vstupDoVeze" ]
			}
		},
		"zahrada": { ... },
		"vstup": { ... }
	},

	"items": {
		"klic": {
			"description": "Klic"
		}
	}

	"modifiers": {
		"smrtelnySkok": "$player.health = 0",
		"vstupDoVeze": "$node.visits++"
	}

}

room "vez"
	#Popis
	description "Jsi ve vezi, je tu tma."
	description "Jsi ve vezi a neni tu zadna princezna."
	description "Jsi ve vezi a je ti zima."
	property image "Image" "vez.jpg"
	property bomb "Tik tak" 0
	
	#Predmety
	item pick klic
	item pick vlasy
	item pick podprsenka
	item static bomba
	item static skrinka
	
	#Akce
	first use klic on skrinka "Odemkl jsi skrinku a nasel jsi prak bez gumy." vez_unlockWardrobe
	first use podprsenka on prak "Prak jsi spravil pomoci podprsenky." vez_repairSling
	first use prak on bomb "Zneskodnil jsi bombu prakem. Prestala tikat." vez_defuseBomb

	#Cesty
	go "jdi dolu" vstup
	go "vyskoc z okna" zahrada smrtlenySkok

	#Tikani bomby
	interval 1000 vez_tickBomb


node
edge
item
entity
modifier

---

node "vez"
	...
	on enter padajiciKostlivec


cond nextLevel
	xp > level_threshold

mod gotLevel
	level+=1
	level_threshold * 1.5

mod checkLevel
	callmod (nextLevel) gotLevel
