import React, { useState, useEffect } from 'react';
import { createStore, createEvent } from 'effector';
import { useStore } from 'effector-react';

import './slider.scss';

//Создание события для загрузки фотографий
const fetchPhotos = createEvent();

//Создание хранилищ 
const $photo = createStore([]);
const $currentPage = createStore(0);
const $autoPlay = createStore(false);

//Создание событий 
const plusPages = createEvent();
const minusPages = createEvent();
const toggleAutoPlay = createEvent();
const autoPlayEffect = createEvent();
const stopAutoPlay = createEvent();

//Отображение фото в зависимости от действий пользователя
$currentPage
  .on(plusPages, (currentPage) => (currentPage + 1) % $photo.getState().length)
  .on(minusPages, (currentPage) => {
    const numPhotos = $photo.getState().length;
    const newPage = (currentPage - 1 + numPhotos) % numPhotos;
    return newPage;
  })
  .on(autoPlayEffect, (currentPage) => (currentPage + 1) % $photo.getState().length)
  .reset(stopAutoPlay);

//Решаю ошибку с асинхронностью, загружаю фотки в хранилище только после их получения
$photo.on(fetchPhotos, (_, data) => data);

//Логика работы автопроигрывания
$autoPlay
  .on(toggleAutoPlay, (autoPlay) => !autoPlay)
  .reset(stopAutoPlay);


const Slider = () => {
  const photo = useStore($photo);
  const currentPage = useStore($currentPage);
  const autoPlay = useStore($autoPlay);

  //Состояние для статуса загрузки
  const [status, setStatus] = useState('Загрузка данных...')

  //Получение фотографий из mockAPI
  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch('https://648b049d17f1536d65ea229b.mockapi.io/Sliders');
        const data = await response.json();
        fetchPhotos(data);
      } catch (error) {
        console.error('Ошибка при загрузке данных:', error);

        //Не забыл про отслеживание загрузки(или ошибки, если возникнет)
        setStatus('Ошибка при загрузке данных. Пожалуйста, обновите страницу')
      }
    };

    fetchData();
  }, []);

  //Управление автопроигрыванием
  useEffect(() => {
    let intervalId;

    if (autoPlay) {
      intervalId = setInterval(() => {
        autoPlayEffect();
      }, 2000); 
    } else {
      clearInterval(intervalId); 
    }

    //Очистка перед размонтированием компонента
    return () => {
      clearInterval(intervalId);
    };
  }, [autoPlay]);

  //Статус загрузки или ошибки
  if (!photo || !photo.length) {
    return <p>{status}</p>;
  }

  //Проверка на всякий случай, чтоб не было отображения несуществующих изображений
  //вдруг выйду за пределы списка фоток
  if (currentPage >= photo.length) {
    return null;
  }

  const currentPhoto = photo[currentPage % photo.length];

  //Отрисовка слайдера
  return (
    <div className="gallery">
      <h3 className="gallery__title">{currentPhoto.name}</h3>

      <button
        className="prev-button"
        aria-label="Посмотреть предыдущий слайд"
        onClick={() => minusPages()}
      >
        &lt;
      </button>

      <img
        className="gallery__photo"
        src={currentPhoto.photos}
        alt={currentPhoto.name}
      />

      <button
        className="next-button"
        aria-label="Посмотреть следующий слайд"
        onClick={() => plusPages()}
      >
        &gt;
      </button>

      <button
        onClick={() => toggleAutoPlay()}
        className="gallery__button"
        aria-label="Включить/отключить автопроигрывание"
      >
        {autoPlay ? 'Остановить автопроигрывание' : 'Запустить автопроигрывание'}
      </button>
    </div>
  );
};

export default Slider;