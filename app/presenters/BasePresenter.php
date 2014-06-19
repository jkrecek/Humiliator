<?php


abstract class BasePresenter extends Nette\Application\UI\Presenter
{
    public function handleData($players) {
        $ids = explode(".", $players);
        $this->payload->data = array();
        foreach ($ids as $id) {
            $url = 'http://dotabuff.com/players/' . $id . '/heroes';

            $dom = $this->getDOM($url);

            $heroes = array();
            $rows = $dom->query("//table[1]/tbody/tr");
            //echo "<br>" . $id . "_<br>";
            //$s = 0;
            //echo "<br>COUNT " . count($rows) . "<br>";
            foreach ($rows as $row) {
                //echo ++$s . "_";
                $cells = $dom->query("td", $row);
                //echo "|" . $cells->length . "<br>";
                if ($cells->length < 5)
                    continue;
                $img = $cells->item(0);
                $name = $cells->item(1)->nodeValue;
                $img_a = $img->childNodes->item(0)->childNodes->item(0);
                $img_src = $img_a->childNodes->item(0)->attributes->getNamedItem("src")->nodeValue;
                $codename = self::getLastUrlPart($img_a->attributes->getNamedItem("href")->nodeValue);
                $played = $cells->item(2)->nodeValue;
                $win_rate = $cells->item(3)->nodeValue;
                $win_rate = substr($win_rate, 0, strlen($win_rate)-1)/100;

                $hero = new stdClass();
                $hero->id = $codename;
                $hero->name = $name;
                $hero->img_src = $img_src;
                $hero->played = $played;
                $hero->win_rate = $win_rate;

                $heroes[] = $hero;
            }

            $this->payload->data[$id] = $heroes;
        }

        $this->sendPayload();
    }

    public function handleTeamData($team) {
        $url = "http://dotabuff.com/teams/" . $team;

        $dom = $this->getDOM($url);

        $this->payload->name = $dom->query("//body/div[1]/div[1]/div[3]/div[1]")->item(0)->nodeValue;
        $this->payload->icon = $dom->query("//body/div[1]/div[1]/div[3]/div[1]/div[1]/img")->item(0)->attributes->getNamedItem("src")->nodeValue;
        //$b = $node->ownerDocument->saveHTML($node);
        //$this->payload->icon  = $b;
        $players_nodes = $dom->query("//body/div[2]/div[1]/div[3]/div[2]/section/article/table/tbody/tr");

        $players = array();
        foreach ($players_nodes as $player_node) {
            $cells = $dom->query("td", $player_node);
            $icon = $dom->query("div[1]/a[1]/img", $cells->item(0))->item(0)->attributes->getNamedItem("src")->nodeValue;
            $column = $cells->item(1);

            $id = self::getLastUrlPart($column->childNodes->item(0)->attributes->getNamedItem("href")->nodeValue);
            $name = $column->nodeValue;

            $player = new stdClass();
            $player->id = $id;
            $player->name = $name;
            $player->icon = $icon;

            $players[] = $player;
        }

        $this->payload->players = $players;
        $this->sendPayload();
    }

    public function handlePlayerName($player) {
        $url = "http://dotabuff.com/players/" . $player;

        $dom = $this->getDOM($url);

        $this->payload->id = $player;
        $this->payload->name = $dom->query("//body/div[1]/div[1]/div[3]/div[1]")->item(0)->nodeValue;
        $this->payload->icon = $dom->query("//body/div[1]/div[1]/div[3]/div[1]/div[1]/div[1]/a[1]/img")->item(0)->attributes->getNamedItem("src")->nodeValue;

        $this->sendPayload();
    }

    function getInnerHTML($Node)
    {
        $Body = $Node->ownerDocument->documentElement->firstChild->firstChild;
        $Document = new DOMDocument();
        $Document->appendChild($Document->importNode($Body,true));
        return $Document->saveHTML();
    }

    private function getDOM($url) {
        $ch = curl_init($url);
        curl_setopt($ch, CURLOPT_HEADER, 0);

        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);

        curl_setopt($ch, CURLOPT_TIMEOUT, 20);

        curl_setopt($ch, CURLOPT_HTTPHEADER, array(
            'Accept:text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*\/*;q=0.8',
            'Accept-Encoding:gzip,deflate,sdch',
            'Accept-Language:cs-CZ,cs;q=0.8,en;q=0.6,sk;q=0.4',
            'Cache-Control:max-age=0',
            'Connection:keep-alive',
            'Host:dotabuff.com',
            'User-Agent:Mozilla/5.0 (Windows NT 6.3; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/35.0.1916.153 Safari/537.36',
        ));

        curl_setopt($ch, CURLOPT_ENCODING, '');

        $dom = new DOMDocument();
        $result = curl_exec($ch);
        @$dom->loadHTML($result);

        curl_close($ch);

        return new DOMXPath($dom);
    }

    private static function getLastUrlPart($string) {
        return substr($string, strrpos($string, "/") + 1);
    }
}
