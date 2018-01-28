<?php
/**
 * Created by PhpStorm.
 * User: andreaem
 * Date: 24/07/17
 * Time: 16:26
 */
$dir = $_SERVER['DOCUMENT_ROOT'] . '/web/webtemp/';


rrmdir($dir);

mkdir($dir,0777,true);
mkdir($dir . '/thumb', 0777, true);
chmod($dir,0777);
chmod($dir . '/thumb', 0777);

function rrmdir($dir) {
    if (is_dir($dir)) {
        $objects = scandir($dir);
        foreach ($objects as $object) {
            if ($object != "." && $object != "..") {
                if (filetype($dir."/".$object) == "dir")
                    rrmdir($dir."/".$object);
                else unlink   ($dir."/".$object);
            }
        }
        if($objects == null) {
            return false;
        } else {
            reset($objects);
            rmdir($dir);
        }
    } elseif (is_file($dir)) {
        unlink($dir);
    }
}