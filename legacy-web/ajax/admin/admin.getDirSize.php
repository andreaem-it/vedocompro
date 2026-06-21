<?php
/**
 * Created by PhpStorm.
 * User: andreaem
 * Date: 24/07/17
 * Time: 19:16
 */
print formatSizeUnits(get_dir_size($_SERVER['DOCUMENT_ROOT'] . '/webtemp/'));

function get_dir_size($directory) {
    $size = 0;
    foreach (new RecursiveIteratorIterator(new RecursiveDirectoryIterator($directory)) as $file) {
        $size += $file->getSize();
    }
    return $size;
}

function dirsize($dir)
{
    @$dh = opendir($dir);
    $size = 0;
    while ($file = @readdir($dh))
    {
        if ($file != "." and $file != "..")
        {
            $path = $dir."/".$file;
            if (is_dir($path))
            {
                $size += dirsize($path); // recursive in sub-folders
            }
            elseif (is_file($path))
            {
                $size += filesize($path); // add file
            }
        }
    }
    @closedir($dh);
    return  $size;
}

function folderSize ($dir)
{
    $size = 0;
    foreach (glob(rtrim($dir, '/').'/*', GLOB_NOSORT) as $each) {
        $size += is_file($each) ? filesize($each) : folderSize($each);
    }
    return $size;
}

function formatSizeUnits($bytes)
{
    if ($bytes >= 1073741824)
    {
        $bytes = number_format($bytes / 1073741824, 2) . ' GB';
    }
    elseif ($bytes >= 1048576)
    {
        $bytes = number_format($bytes / 1048576, 2) . ' MB';
    }
    elseif ($bytes >= 1024)
    {
        $bytes = number_format($bytes / 1024, 2) . ' KB';
    }
    elseif ($bytes > 1)
    {
        $bytes = $bytes . ' bytes';
    }
    elseif ($bytes == 1)
    {
        $bytes = $bytes . ' byte';
    }
    else
    {
        $bytes = '0 bytes';
    }

    return $bytes;
}
