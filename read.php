<?php
	$json = file_get_contents('courses.json');
	$people = json_decode($json);

	print_r($people);
