<!DOCTYPE html>
<html lang="en">
    <head>
		<meta charset="UTF-8">
		<link href="https://maxcdn.bootstrapcdn.com/bootstrap/3.3.7/css/bootstrap.min.css" rel="stylesheet" integrity="sha384-BVYiiSIFeK1dGmJRAkycuHAHRg32OmUcww7on3RYdg4Va+PmSTsz/K68vbdEjh4u" crossorigin="anonymous">
		<link rel="stylesheet" type="text/css" href="style.css">
        <title>FFBE Equip</title>
    </head>
    <body>
        <div class="container">
            <div class="col-xs-12">
                <div class="panel panel-default stat">
                    <div class="panel-heading">
                        <span>Desired stat</span>
                        <a class="buttonLink hidden unselectAll" onclick="unselectAll('stat')">unselect</a>
                    </div>
                    <div class="panel-body">
                        <div class="col-xs-6">
                            <div class="btn-group colors choice" data-toggle="buttons">
								<?php
									$stats = array('hp' => 'HP','mp' => 'MP','atk' => 'ATK','def' => 'DEF','mag' => 'MAG','spr' => 'SPR','evade' => 'Evade','inflict' => 'Inflict','resist' => 'Resist');
									foreach($stats as $valeu => $key) {
										echo '<label class="btn btn-default"><input type="radio" name="stat" value="'.$valeu.'" autocomplete="off">'.$key.'</label>';
									}
								?>
                            </div>
                        </div>
                        <div class="col-xs-6">
                            <form class="form-inline">
                                <div class="form-group">
                                    <label for="baseStat">Base stat (with pots) :</label>
                                    <input type="number" class="form-control" id="baseStat" placeholder="180" onkeypress="return isNumber(event)">
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            </div>
            <div class="col-xs-4 col-lg-6">
                <div class="panel panel-default search">
                    <div class="panel-heading">
						<span>Search</span>
						<input id="searchText" type="text"/>
					</div>
				</div>
                <div class="panel panel-default types">
                    <div class="panel-heading">
						<span>Equipment types</span>
						<a class="buttonLink" onclick="select('types', ['dagger', 'sword', 'greatSword', 'katana', 'staff', 'rod', 'bow', 'axe', 'hammer', 'spear', 'harp', 'whip', 'throwing', 'gun', 'mace', 'fist']); update();">Select all weapons</a>
						<a class="buttonLink" onclick="select('types', ['lightShield', 'heavyShield', 'hat', 'helm', 'clothes', 'robe', 'lightArmor', 'heavyArmor']); update();">Select all armors</a>
						<a class="buttonLink hidden unselectAll" onclick="unselectAll('types')">unselect all</a>
					</div>
                    <div class="panel-body">
						<div class="btn-group types choice" data-toggle="buttons">
							<?php
                                $types = array('dagger','sword','greatSword','katana','staff','rod','bow','axe','hammer','spear','harp','whip','throwing','gun','mace','fist','lightShield','heavyShield','hat','helm','clothes','robe','lightArmor','heavyArmor','accessory','materia');
                                for ($i=0; $i < count($types); $i++) { 
                                    echo '<label class="btn btn-default"><input type="checkbox" name="types" value="'.$types[$i].'" autocomplete="off"><img src="img/'.$types[$i].'.png"/></label>';
                                }
                            ?>
					</div>
				</div>
			</div>
		
			<div class="panel panel-default elements">
				<div class="panel-heading"><span>Elements</span><a class="buttonLink hidden unselectAll" onclick="unselectAll('elements')">unselect all</a></div>
				<div class="panel-body">
					<div class="btn-group elements choice" data-toggle="buttons">
						<?php
							$elements = array('fire','ice','lightning','water','wind','earth','light','dark','noElement');
							for ($i=0; $i < count($elements); $i++) { 
								echo '<label class="btn btn-default"><input type="checkbox" name="elements" value="'.$elements[$i].'" autocomplete="off"><img src="img/'.$elements[$i].'.png"/></label>';
							}
						?>
					</div>
				</div>
			</div>
			<div class="panel panel-default ailments">
				<div class="panel-heading"><span>Status ailment</span><a class="buttonLink hidden unselectAll" onclick="unselectAll('ailments')">unselect all</a></div>
				<div class="panel-body">
					<div class="btn-group ailments choice" data-toggle="buttons">
						<?php
							$ailments = array('poison','blind','sleep','silence','paralysis','confuse','disease','petrification');
							for ($i=0; $i < count($ailments); $i++) { 
								echo '<label class="btn btn-default"><input type="checkbox" name="ailments" value="'.$ailments[$i].'" autocomplete="off"><img src="img/'.$ailments[$i].'.png"/></label>';
							}
						?>
					</div>
				</div>
			</div>
            <div class="panel panel-default killers">
				<div class="panel-heading"><span>Killers</span><a class="buttonLink hidden unselectAll" onclick="unselectAll('killers')">unselect all</a></div>
				<div class="panel-body">
					<div class="btn-group elements choice" data-toggle="buttons">
						<?php
							$killers = array('aquatic','beast','bird','bug','demon','dragon','human','machine','plant','undead','stone','spirit');
							for ($i=0; $i < count($killers); $i++) { 
								echo '<label class="btn btn-default"><input type="checkbox" name="killers" value="'.$killers[$i].'" autocomplete="off">'.$killers[$i].'</label>';
							}
						?>
					</div>
				</div>
			</div>
            <div class="panel panel-default accessToRemove">
				<div class="panel-heading"><span>Remove Access</span><a class="buttonLink hidden unselectAll" onclick="unselectAll('accessToRemove')">unselect all</a></div>
				<div class="panel-body">
                    <div class="btn-group elements choice" data-toggle="buttons">
						<?php
                            $accessToRemove = array('shop' => 'Shop','chest/quest' => 'Story','key' => 'Key','colosseum' => 'Colosseum','TMR-1*/TMR-2*' => 'TMR 1*/2*','TMR-3*/TMR-4*' => 'TMR 3*/4*','TMR-5*' => 'TMR 5*','event' => 'Event','recipe' => 'Recipe','trophy' => 'Trophy','chocobo' => 'Chocobo','trial' => 'Trial','unitExclusive' => 'Unit exclusive');
                            foreach($accessToRemove as $value => $key) {
                                echo '<label class="btn btn-default"><input type="checkbox" name="accessToRemove" value="'.$value.'" autocomplete="off">'.$key.'</label>';
                            }
                        ?>
                    </div>
				</div>
			</div>
            <div class="panel panel-default additionalStat">
				<div class="panel-heading"><span>Additional stat filter</span><a class="buttonLink hidden unselectAll" onclick="unselectAll('additionalStat')">unselect all</a></div>
				<div class="panel-body">    
                    <div class="btn-group colors choice" data-toggle="buttons">
						<?php
                            $additionalStat = array('hp' => 'HP','mp' => 'MP','atk' => 'ATK','def' => 'DEF','mag' => 'MAG','spr' => 'SPR');
                            foreach($additionalStat as $value => $key) { 
                                echo '<label class="btn btn-default"><input type="radio" name="additionalStat" value="'.$value.'" autocomplete="off">'.$key.'</label>';
                            }
                        ?>
                    </div>
                </div>
            </div>
			<div>
				<a class="buttonLink" href="https://www.reddit.com/message/compose/?to=lyrgard">Send me a message on reddit</a>
                <form action="https://www.paypal.com/cgi-bin/webscr" method="post" target="_top">
                    <input type="hidden" name="cmd" value="_s-xclick">
                    <input type="hidden" name="encrypted" value="-----BEGIN PKCS7-----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-----END PKCS7-----">
                    <input id="donateLink" type="submit" value="Donate">
                </form>
			</div>			
        </div>
        <div  class="col-xs-8 col-lg-6">
			<div class="panel panel-default">
				<div class="panel-heading">Results : <span id="resultNumber"></span></div>
				<div class="panel-body" style="padding:0;">
					<table id="results" class="table table-hover notSorted">
						<thead>
							<tr>
								<th>Name</th>
								<th id="statTitle" class="sort">Value</th>
								<th>Type</th>
								<th>Special</th>
								<th>Access</th>
							</tr>
						</thead>
						<tbody>
							
						</tbody>
					</table>
				</div>
			</div>
			<div>Data updated July 7th, 2017. Added Zargabaath banner TMR and Henne Mines king mog items</div>
		</div>
		<script src="https://code.jquery.com/jquery-3.1.0.min.js" integrity="sha256-cCueBR6CsyA4/9szpPfrX3s49M9vUU5BgtiJj06wt/s=" crossorigin="anonymous"></script>
		<script src="https://maxcdn.bootstrapcdn.com/bootstrap/3.3.7/js/bootstrap.min.js" integrity="sha384-Tc5IQib027qvyjSMfHjOMaLkfuWVxZxUPnCJA7l2mCWNIpG9mGCD8wGNIcPD7Txa" crossorigin="anonymous"></script>
		<script src="https://cdn.jsdelivr.net/mark.js/8.9.1/jquery.mark.min.js"></script>
		<script src="lib/jquery.ba-throttle-debounce.min.js"></script>
		<script src="core.js"></script>
    </body>
</html>