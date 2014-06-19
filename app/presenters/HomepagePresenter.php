<?php

/**
 * Homepage presenter.
 */
class HomepagePresenter extends BasePresenter
{

    public function actionDefault() {
        //$data = $this->loadPlayerHeroesData(array(109818586));
        //$this->sendResponse(new Nette\Application\Responses\JsonResponse($data));

    }

	public function renderDefault()
	{
		$this->template->anyVariable = 'any value';
	}

}
