# &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; 🗓️ 스케줄 헬퍼 (Schedule Helper) / (Slack App)

<p align="center">
   <img src="https://github.com/donghyeun02/calendarBot/assets/129716523/a9ea406d-00ef-47aa-89e8-43b6f9a135e4" height="300px" width="300px"> <br>
  <a href="https://hits.seeyoufarm.com"><img src="https://hits.seeyoufarm.com/api/count/incr/badge.svg?url=https%3A%2F%2Fgithub.com%2Fdonghyeun02%2FcalendarBot&count_bg=%2379C83D&title_bg=%23555555&icon=&icon_color=%23E7E7E7&title=schedule-helper&edge_flat=false"/></a>  
</p>

> 개인 프로젝트 : 스케줄 헬퍼 <br>
> 개발 기간 : 2023. 09 ~ 2023. 11 <br>
> 주요 기능 <br> > &nbsp;&nbsp;&nbsp; 구글 캘린더를 구독하여 일정에 대한 등록, 변경, 삭제의 이벤트들을 슬랙 채널로 받을 수 있습니다 ! <br> > &nbsp;&nbsp;&nbsp; 리마인더 시간대를 설정하여 당일 일정들을 슬랙 채널로 받을 수 있습니다 !
> <br>

## 🤔 기능 개발 사유

- 이전 슬랙을 사용하는 곳에서 구글 캘린더 일정 30분 전에 슬랙으로 알림이 보내졌었음.
- 그러나 30분 전에 알림을 받은 후 일정이 변경되거나 삭제될 시에는 따로 알림이 없어 불편함을 느낌.
- 그래서 일정에 대한 등록, 변경, 삭제에 대한 이벤트 알림을 받기 위해 개발하게 되었습니다,,

<br>

## 💡 슬랙 앱 설치 링크

[스케줄 헬퍼](https://slack.com/oauth/v2/authorize?client_id=5093381943072.5854431103427&scope=[…]:write.public,groups:history,im:history,mpim:history&user_scope=)

<br>

## 🐥 UI 구성

| 로그인 전                                                                                                                            | 로그인 후                                                                                                                            |
| ------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------ |
| <img width="450" alt="image" src="https://github.com/donghyeun02/calendarBot/assets/129716523/d4870189-9463-4c4e-896d-bc353041dbc4"> | <img width="450" alt="image" src="https://github.com/donghyeun02/calendarBot/assets/129716523/fda38a37-c65c-410d-81a7-84540bb62ceb"> |
| 구글 로그인                                                                                                                          | 캘린더 구독 및 리마인더 시간대 설정                                                                                                  |

<br>

## 🐤 기능 소개 (구글 캘린더)

### 캘린더 구독

- 구독할 캘린더 및 알림을 받을 슬랙 채널을 선택한다.
- 웹훅 등록을 진행한다.
- 슬랙 채널로 구글 캘린더 일정(단일, 종일, 반복) 등록, 변경, 삭제에 대한 알림을 받을 수 있습니다.
  <br>

### 캘린더 리마인더

- 구독할 캘린더 및 알림을 받을 슬랙 채널을 선택한다.
- 리마인더를 받을 시간대(1시간 단위)를 선택한다.
- 슬랙 채널로 리마인더 시간대에 당일 일정(단일, 종일, 반복)에 대한 알림을 받을 수 있습니다.
  - 일정이 없을 시에는 알림이 없음을 슬랙 채널로 받습니다.

### 일정 시작 15분 전 알림

- 캘린더 구독 서비스를 사용하게 되면 자동으로 알림이 갑니다.
- 09시 - 23시 까지의 일정들에 대해 15분 전 알림을 받을 수 있습니다.

<br>

## 🐤 Service Architecture

<p align="center">
   <img src="https://github.com/donghyeun02/calendarBot/assets/129716523/b7424f69-3bd7-4798-8ec0-08c2039f0821" height="500px" width="600px"> <br>
</p>

## 🐤 Stacks

<p align="center">
  <img src="https://firebasestorage.googleapis.com/v0/b/stackticon-81399.appspot.com/o/images%2F1700468000212?alt=media&token=66350ea1-e8af-4f9f-9226-c6e3713575b4">
</p>
