---
layout: blog_post
title: "테라폼(Terraform) 프로젝트 구성하기"
description: "현재 운영 중인 테라폼 프로젝트의 구조와 CI 설정을 공유합니다."
header-img: "blog/img/bg-1.jpg"
date: 2019-05-01
author: "kt.kang"
category: engineering
published: true
---

# 테라폼(Terraform) 프로젝트 구성하기

## 들어가며
이번에 AWS에 새 인프라를 구축하면서 테라폼을 사용했습니다.
테라폼 코드 작성법과 사용법은 공식 문서에 잘 나와있어서 금방 습득할 수 있었지만, 프로젝트를 구성하는 방법은 정해진 답이 없었습니다.

저희도 나름의 답을 찾기위해 이것저것 수정해왔습니다.
비슷하게 테라폼을 시작하려는 분들께 참고가 되었으면 하는 바람으로 현재 프로젝트를 어떻게 구성했는지 공유드립니다.

<small>주의: 이 글은 테라폼에 대해 기본 지식이 있는 독자를 대상으로 쓰여졌습니다.
만약 테라폼이 처음이라면 먼저 [HashiCorp에서 제공하는 튜토리얼](https://learn.hashicorp.com/terraform/)을 진행해보고 읽는 것을 권장합니다.</small>

#### 목차
- [들어가며](#들어가며)
- [코드 관리](#코드-관리)
- [원격 백엔드 (remote backend)](#원격-백엔드-remote-backend)
- [파일, 디렉토리명](#파일-디렉토리명)
- [디렉토리 구조](#디렉토리-구조)
  - [하나의 큰 state를 사용하는 구조](#하나의-큰-state를-사용하는-구조)
  - [여러 작은 state가 합쳐진 구조](#여러-작은-state가-합쳐진-구조)
- [GitLab CI 설정](#gitlab-ci-설정)
  - [스테이지 설계](#스테이지-설계)
  - [CI캐시](#ci캐시)
  - [plan 결과 전달](#plan-결과-전달)
  - [apply 일시 정지](#apply-일시-정지)
  - [완성된 CI 설정 파일 예시](#완성된-ci-설정-파일-예시)
- [마치며](#마치며)
- [참고자료](#참고자료)


## 코드 관리

에디터로는 현재 IntelliJ 기반 IDE에 [테라폼 플러그인](https://plugins.jetbrains.com/plugin/7808-hashicorp-terraform--hcl-language-support)을 설치해서 사용하고 있습니다.
Visual Code에도 [테라폼 확장](https://marketplace.visualstudio.com/items?itemName=mauve.terraform)을 설치해서 사용해봤는데 이것도 괜찮았습니다.

둘 다 자동완성이나 문법 강조 기능이 잘 되어있습니다. 사용하고 있는 IDE에 따라 선택하면 될 것 같습니다.

![IntelliJ 테라폼 플러그인](/blog/img/2019-05-01/intellij-plugin.png){:data-action="zoom"}
<figcaption>현재 사용 중인 IntelliJ의 테라폼 플러그인</figcaption>

좀 더 엄격히 코드를 관리하고 싶으면 Git hook 설정을 추가하면 좋습니다.
pre-commit hook에서 `terraform validate`를 호출하면 문법 오류가 있는 소스를 커밋할 수 없습니다.
`terraform fmt`도 호출하면 코드 스타일까지 검사할 수 있습니다.

```bash
#!/usr/bin/env bash
set -e

# 커밋될 파일들이 포함된 각 디렉토리에 대해
# 'terraform validate'와 'terraform fmt'를 호출합니다.

dirs=$(git diff --cached --name-only --diff-filter=d | xargs dirname | uniq)

for d in ${dirs}
do
    if ! /usr/local/bin/terraform validate ${d}
    then
        echo "Error: 'terraform validate' failed on ${d}" >&2
        exit 1
    fi

    if ! /usr/local/bin/terraform fmt -check=true ${d}
    then
        echo "Error: 'terraform fmt' failed on ${d}" >&2
        exit 1
    fi
done
```
<figcaption>hook 스크립트의 예시. .git/hooks/pre-commit에 생성해서 실행 권한을 부여하면 됩니다.</figcaption>

## 원격 백엔드 (remote backend)
테라폼을 통해서 변경된 인프라 정보는 state라는 곳에 JSON 형태로 기록됩니다.
apply로 인프라를 변경할 때 이전에 생성했던 리소스를 정확히 찾을 수 있는 것은 state에 저장된 정보 덕분입니다.

테라폼은 기본적으로 state를 로컬에 terraform.tfstate라는 파일로 저장합니다.
로컬 스토리지에 저장하면 팀원들과 공유할 수 없고 유실될 위험이 있기 때문에, 백엔드를 설정해서 원격에 위치한 서버에 안전하게 저장하는 것이 좋습니다.

### AWS S3를 백엔드로 사용하기
테라폼은 consule부터 etcd 등 여러가지 타입의 원격 백엔드를 지원합니다.

저희는 그 중 AWS S3 타입의 백엔드를 선택했습니다.
S3는 높은 가용성을 보장하고 비용도 저렴합니다. 무엇보다 서버를 운영할 필요가 없어서 편리합니다.
<small>(참고로 S3와 비슷한 도구인 Azure Blob Storage나 Google Cloud Storage 타입도 지원하고 있습니다. Azure나 GCP를 사용하는 분들이 사용하면 좋을 것 같습니다.)</small>

먼저 S3에 버킷을 하나 생성하고 아래 내용을 소스에 추가합니다.

```
terraform {
  backend "s3" {
    bucket = "mybucket"
    key    = "path/to/bucket/prefix"
    region = "ap-northeast-2"
  }
}
```
이제 기존처럼 테라폼을 사용하면 지정한 S3 버킷에 state가 json파일로 저장되고, 다른 머신에서도 S3에 저장된 state를 받아올 수 있습니다.

## 파일, 디렉토리명
파일명은 어떤 내용을 담고 있는지 알 수 있는 직관적인 이름이라면 어떤 것이라도 상관없다고 생각합니다.
하지만 최소한의 가이드는 세워두는 편이 좋을 것 같아서 아래와 같은 기준을 세웠습니다. GitHub에서 많은 사람들이 사용하는 이름을 참고했습니다.
- `main.tf`: 백엔드와 프로바이더 설정, 그리고 리소스들을 정의합니다.
- `variables.tf`: local variable을 포함한 모든 variable들을 정의합니다. 변수는 아니지만 읽기 전용이라는 관점에서 데이터 소스도 이곳에 포함시킵니다.
- `outputs.tf`: output들을 정의합니다.
- `그 외 tf파일`: 리소스가 너무 많아서 main.tf가 비대해지는 경우 파일을 분리합니다. 주로 기술한 리소스 종류를 이름으로 합니다. (예: alb.tf)
더 분리할 경우엔 접두사를 활용합니다. (예: alb-xxx.tf, alb-yyy.tf)
- `includes/`: json이나 각종 스크립트, ssh키 등의 데이터용 파일을 담는 디렉토리 입니다.
- `modules/`: 모듈을 정의한 디렉토리 입니다. 보통 프로젝트 루트에 두는데, 특정 모듈에서만 사용되는 서브 모듈을 정의할 때는 부모 모듈 디렉토리 안에 만듭니다.

## 디렉토리 구조
테라폼 plan이나 apply는 디렉토리 단위로 작업을 진행하는데, 한 디렉토리에 위치한 *.tf파일들을 모두 읽어들입니다.
이렇게 읽어들인 리소스들은 state에 반영할 때도 같이 반영됩니다.

결과적으로 같은 디렉토리에 정의된 리소스는 같은 state에 저장된다는 이야기입니다.
그렇기 때문에 디렉토리 구조를 정하고 소스 파일을 배분하는 일은, state에 리소스들을 어떻게 배분할지 정하는 일과 같습니다.

### 하나의 큰 state를 사용하는 구조
프로젝트 초기에는 인프라가 단순하고 코드도 적어서 디렉토리 구조가 간단했습니다.

```
.
├── include/
│   └── ssh-keys/
├── modules/
│   ├── ec2_instance/
│   ├── ecs_autoscaling_cluster/
│   └── iam_user/
├── iam.tf
├── vpc.tf
├── alb.tf
├── ec2.tf
└── ecs.tf
```
<figcaption>modules로 분리한 코드들을 제외하면 프로젝트 루트에 모든 소스를 두고 있습니다.</figcaption>

이 구조에서 apply는 프로젝트 루트 디렉토리 한 곳에서만 실행합니다. 즉 state는 하나만 존재하고 모든 리소스가 그곳에 저장됩니다.

이런 단일 state 구조는 인프라 규모가 작을때는 별 문제 없었습니다. 하지만 리소스 개수가 많아질수록 단점이 보이기 시작했습니다.

#### 1. refresh가 오래 걸리는 문제
테라폼은 plan, apply를 할 때마다 refresh 과정을 거칩니다. ("Refreshing state ..."라는 메세지 출력을 보셨을 겁니다.)
state에 기록된 인프라의 현재 상태를 가져오는 과정인데, state에 기록된 인프라가 많을 수록 이 refresh 작업이 길어집니다.

구성에 따라 다르겠지만 경험상 state가 작은 경우 10초 ~ 30초 정도, state가 크면 1분 이상의 시간을 소모했습니다.
plan은 작업하면서 빈번히 실행하기 때문에 refresh가 오래 걸리면 업무 효율이 떨어집니다.

![Refreshing state](/blog/img/2019-05-01/refreshing-state.png){:data-action="zoom"}
<figcaption>plan 결과를 기다리고 있다보면 자꾸 딴짓을 하고 싶은 충동이 듭니다. 😈</figcaption>

#### 2. 너무 넓은 피해 범위
간혹 state가 망가지는 경우가 생길 수 있습니다.
가장 겪기 쉬운 경우는 `terraform mv`나 `terraform rm` 명령으로 직접 state를 편집하다가 실수로 잘못 변경하는 경우입니다.
리소스 이름을 바꾸거나 구조를 변경할 때, 어쩔 수 없이 직접 편집해야 할 경우가 있습니다. 이런 경우 백업된 state가 있다면 다소 쉽게 복원할 수 있습니다.

매우 드문 경우지만, 버그 등의 알 수 없는 이유로 crash가 발생해서 state가 망가지는 경우도 있습니다.
이 상태에서는 테라폼 작업이 진행되지 않고 해결도 쉽지 않습니다. 심하면 state를 처음부터 구성해야 할 수도 있습니다.

물론 버그가 쉽게 생기진 없겠지만.. 아직 테라폼이 0.x대 버전이라는 점을 기억해야 합니다.
GitHub에서도 많은 [crash 이슈들](https://github.com/hashicorp/terraform/labels/crash)을 찾아볼 수 있습니다.

```
panic: runtime error: index out of range
goroutine 1 [running]:
github.com/hashicorp/terraform/config/module.Storage.loadManifest(0xc0002f2240, ...)

...(skip)

!!!!!!!!!!!!!!!!!!!!!!!!!!! TERRAFORM CRASH !!!!!!!!!!!!!!!!!!!!!!!!!!!!

Terraform crashed! This is always indicative of a bug within Terraform.
A crash log has been placed at "crash.log" relative to your current
working directory. It would be immensely helpful if you could please
report the crash with Terraform[1] so that we can fix this.
```
<figcaption>대략 이런 형태의 메세지가 뜬다면.. 😨</figcaption>

단일 state 구조에서는 인프라 일부를 변경하더라도 전체 시스템을 망가뜨릴 수 있습니다.
피해를 최소화하고 쉽게 복구할 수 있게 만들려면, state를 나누어 작게 유지해야 합니다.

### 여러 작은 state가 합쳐진 구조
현재 사용하고 있는 구조입니다. 개발 환경에 따라 dev, prod로 나누고 서비스 역할에 따라 다시 세분화 시켰습니다.

```
.
├── dev/
│   ├── global/
│   ├── network/
│   ├── role/
│   └── backend/
│       ├── api/
│       │   ├── includes/
│       │   ├── main.tf
│       │   ├── outputs.tf
│       │   └── variables.tf
│       ├── db/
│       ├── reverse-proxy/
│       └── secret/
├── prod/
│   ├── global/
│   ├── network/
│   ├── role/
│   └── backend/
│       ├── api/
│       ├── db/
│       ├── reverse-proxy/
│       └── secret/
└── modules
    ├── alb/
    ├── ec2_bastion_nat/
    ├── ecs_autoscaling_cluster/
    ├── iam_user/
    ├── network/
    └── ssm_parameters/
```

이 구조에서는 각 소스 디렉토리마다 apply를 실행합니다. 그 수만큼 state가 만들어지는데, 마치 단일 state를 여러개 운영하는 것과 같습니다.

이렇게 state를 나누면 단일 state의 문제는 개선되지만, 다른 state에 존재하는 값을 읽기 어려워집니다.
불가능한 것은 아니지만 다소 번거로운 과정을 거칩니다.

VPC 리소스의 id가 필요한 경우를 예로 들어봅시다.
같은 state에 VPC 리소스가 있으면 필요한 곳에서 `"${aws_vpc.main.id}"`로 쉽게 참조할 수 있습니다.
하지만 리소스가 다른 state에 있으면 VPC 리소스 정의가 존재하지 않으므로 바로 값을 참조할 수 없습니다.

테라폼은 이런 경우 사용할 수 있도록 state를 대상으로 하는 `terraform_remote_state` 데이터 소스를 지원합니다.
이 데이터 소스는 다른 데이터 소스처럼 리소스를 읽어오는 것이 아니라, 지정된 state의 내용을 읽습니다.
`terraform_remote_state`로 원하는 값을 읽으려면 먼저 output으로 해당 state에 기록되어 있어야 합니다.

```
data "terraform_remote_state" "network" {
  backend = "s3"
  config {
    bucket = "mybucket"
    region = "ap-northeast-2"
    key = "prod/network"
  }
}

# vou_main_id라는 output 변수가 network state에 정의되어 있어야 합니다.
"${data.terraform_remote_state.network.vpc_main_id}"
```

이런 번거로움을 줄이려면 연관성이 높은 리소스들을 한 state에 모아서, 가급적 다른 state에 있는 변수를 참조하지 않도록 설계해야 합니다.

state간 참조가 많아서 여러 state에 걸쳐서 변경이 발생하는 일이 잦으면 작은 state구조의 장점이 사라집니다.
변경이 발생한 state 전부를 갱신하는데에 많은 시간이 들고, 의존이 얽혀서 부분 장애로 인한 피해가 확산됩니다.
이런 일이 발생한다면 state를 잘못 분리한 것은 아닌지 설계를 재검토해 볼 필요가 있습니다.


## GitLab CI 설정
저희는 소스 저장소로 GitLab을 사용하는데, GitLab은 저장소와 잘 통합된 CI 서비스를 제공하고 있습니다.
기능이 많고 사용도 간편해서 테라폼 프로젝트에 GitLab CI를 연동했습니다.

### 스테이지 설계
plan과 apply 중간에 plan 결과를 확인하는 과정이 필요하므로 나누어 진행되어야 합니다. 그래서 두 plan과 apply 두 스테이지로 나누었습니다.

init은 스테이지를 분리하지 않고, 대신 plan, apply를 할 때마다 init을 같이 실행했습니다.
이유는 plan, apply 스테이지에 init스테이지에서 받은 파일을 넘기는 과정이 생각보다 오래 걸렸기 때문입니다. init으로 받은 테라폼 플러그인과 모듈 데이터 사이즈가 의외로 큽니다.

![GitLab stages](/blog/img/2019-05-01/gitlab-stages.png){:data-action="zoom"}
<figcaption>Slack 알림이 필요하면 그림처럼 notify 스테이지를 추가하는 것도 좋습니다.</figcaption>

### CI캐시
매 단계에서 init을 실행하도록 설계했지만 CI캐시를 설정하면 빠른 속도로 처리할 수 있습니다.
init으로 받아오는 데이터는 .terraform 디렉토리에 저장됩니다.
아래처럼 `cache` 옵션으로 지정하면 CI캐시에 저장되어 다음번부터는 job시작 시 미리 불러오게 됩니다.

```yaml
cache:
  key: terraform
  paths:
  - .terraform
```

### plan 결과 전달
plan 단계에서 계산했던 결과를 apply단계에서 그대로 적용하려면, plan 결과를 출력해서 저장해두고 전달하면 됩니다.
전달된 파일은 apply를 실행 시 인자로 전달할 수 있습니다.

plan에 -out 옵션을 사용하면 결과를 파일로 저장합니다.

```bash
# CI 파이프라인마다 파일명이 달라지도록 CI_PIPELINE_ID 환경변수를 사용합니다.
terraform plan -out=.terraform/${CI_PIPELINE_ID}.tfplan
```

plan 스테이지에서 생성된 파일을 apply 스테이지에 전달하려면 GitLab CI의 `artifact` 옵션을 설정합니다.
이 옵션으로 지정된 파일은 GitLab 서버에 저장되어 이 후 진행되는 단계부터는 접근할 수 있게 됩니다.

주의할 것은 plan 파일은 `cache` 옵션을 사용해서 전달하려고 하면 안됩니다.
`cache`와 `artifact`는 둘 다 스테이지 간에 파일을 공유할 수 있는 기능이지만 조금 다르게 동작합니다.

메뉴얼에 따르면 다수의 CI러너를 운영하는 경우, CI캐시를 저장해도 아직 다른 CI러너에는 CI캐시가 존재하지 않을 수 있습니다.
`cache` 옵션은 데이터가 존재하지 않아도 진행에 문제없는 데이터에만 적용하라고 안내되어 있습니다.
plan 파일은 apply 진행에 필수적이므로 CI캐시에 적합하지 않습니다.

```yaml
plan:
  artifacts:
    paths:
    - .terraform/${CI_PIPELINE_ID}.tfplan
  expire_in: 3 hrs
  script:
  - terraform plan -out=.terraform/${CI_PIPELINE_ID}.tfplan
```

### apply 일시 정지
진행 중간에 plan 결과를 확인하려면, plan이 끝난 뒤 진행을 멈추고 다시 진행시킬 수 있어야 합니다.

마침 GitLab CI에는 manual job이라는 기능이 있습니다.
CI job에 `when: manual` 옵션을 설정하면, job을 바로 진행하지 않고 관리자가 버튼을 누를때까지 대기합니다.

apply에 이 옵션을 적용합니다. 그러면 apply가 중단된 동안 plan 결과를 확인할 수 있습니다.
확인이 끝나고 결과에 문제가 없으면 대기하고 있던 apply를 진행시킵니다.

![GitLab manual job](/blog/img/2019-05-01/gitlab-manual-job.png){:data-action="zoom"}
<figcaption>apply가 대기 중인 모습입니다. ▶️버튼을 누르면 진행됩니다.</figcaption>

### 완성된 CI 설정 파일 예시
위 내용을 종합해서 만든 .gitlab-ci.yml의 예시입니다.

```yaml
image:
  name: hashicorp/terraform:0.11.13
  entrypoint: [""] # 공식 이미지의 entrypoint가 shell이 아니므로 이를 지워주어야 함

variables:
  # TF_*는 테라폼에서 사용하는 환경 변수들
  # 참고: https://www.terraform.io/docs/commands/environment-variables.html
  TF_INPUT: 0
  TF_IN_AUTOMATION: 1

  AWS_ACCESS_KEY_ID: "${AWS_ACCESS_KEY_ID_PROD}"
  AWS_SECRET_ACCESS_KEY: "${AWS_SECRET_ACCESS_KEY_PROD}"
  AWS_DEFAULT_REGION: ap-northeast-2

stages:
  - plan
  - apply

plan:
  stage: plan
  cache:
    key: terraform
    paths:
    - .terraform
  artifacts:
    paths:
    - .terraform/${CI_PIPELINE_ID}.tfplan
  expire_in: 3 hrs

  before_script:
  - terraform init
  script:
  - terraform plan -out=.terraform/${CI_PIPELINE_ID}.tfplan

apply:
  stage: apply
  only:
    - master
  when: manual
  allow_failure: false
  dependencies:
    - plan
  cache:
    key: terraform
    paths:
    - .terraform
    policy: pull

  before_script:
  - terraform init
  script:
  - terraform apply .terraform/${CI_PIPELINE_ID}.tfplan
```

## 마치며
사실 테라폼을 도입하고 초반에는 일이 더 늘어난 느낌을 받았습니다. HCL문법이 특이했고 state를 익숙하게 관리하기까지 적응 기간이 필요했습니다.
이런 부분에서 팀원들도 불편을 토로했기 때문에 지속적으로 설득헤야 했습니다.

지금은 적응되어서 다같이 잘 사용하고 있습니다.
자주 변경이 발생하는 방화벽이나 권한, 각종 수치들은 이제 따로 문서없이 테라폼 코드만으로 쉽게 파악할 수 있게 되었습니다.

무엇보다 개발자가 늘상 해오던 코드 관리 노하우를 그대로 인프라 관리에 활용할 수 있어서 좋습니다.
자연스럽게 저장소에 기록하고 버전을 관리하며 리뷰도 진행합니다. 문서로 관리할 때와 다르게 일이 진행되는 것이 신기했습니다.

앞으로 많은 사람들이 테라폼을 사용해서 테라폼 커뮤니티가 더 발전했으면 하는 마음입니다. 이 글이 조금이라도 도움이 되었으면 좋겠네요. 😊️

## 참고자료
- [Gruntwork Blog - How do I structure my Terraform projects?](https://blog.gruntwork.io/how-to-manage-terraform-state-28f5697e68fa)
- [Charity Majors - TERRAFORM, VPC, AND WHY YOU WANT A TFSTATE FILE PER ENV](https://charity.wtf/2016/03/30/terraform-vpc-and-why-you-want-a-tfstate-file-per-env/)
- [J.D. Hollis - Working with Terraform: 10 Months In](https://theconsultingcto.com/posts/working-with-terraform-10-months-in/)
- [J.D. Hollis - How do I structure my Terraform projects?](https://theconsultingcto.com/posts/how-do-i-structure-my-terraform-project/)
