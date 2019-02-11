<?php
require('../src/AfterShip/Exception/AftershipException.php');
require('../src/AfterShip/Core/Request.php');
require('../src/AfterShip/Couriers.php');
require('../src/AfterShip/Trackings.php');
require('../src/AfterShip/LastCheckPoint.php');


use \AfterShip\Exception\AftershipException;

$key = 'c28901a7-3922-4119-bf9a-896bce8a5f2d';

$couriers = new AfterShip\Couriers($key);
$trackings = new AfterShip\Trackings($key);
$last_check_point = new AfterShip\LastCheckPoint($key);

$number = $_GET['number'];
$slug = $_GET['slug'];

$response = $couriers->get();

//$response = $trackings->get('china-ems', 'EV942706669CN');
//$response = $trackings->get('china-ems', 'EV942706669CN', array('lang' => 'en'));
//$response = $trackings->get('china-ems', 'EV942706669CN', array('fields' => 'title,tracking_destination_country', 'lang' => 'en'));

//$response = $couriers->detect($number);

$tracking_info = array(
    'slug'    => $slug,
    'title'   => 'vedocompro-tracking'
);
//$response = $trackings->create('41910575873', $tracking_info);

//$response = $trackings->delete('rocketparcel', '100006802232');

//$response = null;

// $response = $trackings->get_all('', array('slug' => 'austrian-post-registered'));

try {
    $response = $trackings->create($number, $tracking_info);
} catch (AftershipException $e) {
    echo $e->getMessage();
} catch (Exception $e) {
    echo $e->getMessage();
}

//$response = $last_check_point->get_by_id('5694783e6e61b7bd427c1b8a');

print '<pre>';
var_export($response);
print '</pre>';