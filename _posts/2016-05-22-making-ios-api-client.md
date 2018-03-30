---
layout: blog_post
title: "iOS에서 간결한 API 클라이언트 구현하기 (like Retrofit+GSON)"
description: "API 통신 관련 중복 코드를 최소화하면서"
header-img: "blog/img/bg-1.jpg"
date: 2016-05-22
author: kering
category: engineering
published: true
---

_이 글은 안드로이드 개발에서 웹 서버 API 클라이언트를 간결하게 구현할 수 있도록 도와주는 강력한 오픈소스 라이브러리인 [Retrofit](http://square.github.io/retrofit/)과 [GSON](https://github.com/google/gson)의 조합을 iOS 개발에서도 따라해보고 싶은 분들을 위해 작성되었습니다. Retrofit+GSON를 실제로 사용하는 좋은 예제는 [다른 블로그 글](http://blog.robinchutaux.com/blog/a-smart-way-to-use-retrofit/)에서도 찾아볼 수 있습니다._

# 배경
리디북스 서비스가 발전하면서 점점 복잡해지고, 자연히 앱의 기능도 다양해지기 시작했습니다. 기능이 다양해지면서 웹 서버와의 연동을 위한 API 종류도 늘어났고 앱 내에서 API 호출이 필요한 부분도 다양해지면서 관련된 중복 코드가 이곳 저곳에 산재하게 되었고 전체적인 코드 퀄리티 향상을 위해 이를 최소화하고 모듈화 할 필요성이 생겼습니다.

안드로이드에서는 Pure Java로 작성되어 어노테이션을 통한 간결한 코드를 사용할 수 있게 해주는 Retrofit을 GSON과 연동하여 JSON 응답을 손쉽게 객체에 맵핑 하여 사용함으로써 이러한 문제를 성공적으로 해결할 수 있었습니다. 이후 iOS 개발을 진행하면서 비슷한 역할을 할 수 있는 도구가 있을까 찾아봤지만 마땅하지 않아 결국 사용 가능한 도구들을 이용해 비슷하게 따라해보기로 했습니다.

# 목표
Retrofit+GSON 조합을 최대한 따라해서 iOS 앱의 코드 퀄리티를 높이기 위한 작업을 진행하기는 하지만 모방하는 것 자체가 목적이 될 수는 없으므로, 구체적인 목적은 다음과 같은 것들로 상정해보았습니다.

* API 통신 부분을 모듈화하여 관련 중복 코드를 최소화하기
* NSArray, NSDictionary를 직접 사용하여 제어 했던 JSON 처리 부분을 추상화하여 모델 클래스를 정의, JSON 응답을 자동으로 객체에 맵핑 해서 사용할 수 있도록 하기

# 필요한 것
* Retrofit과 GSON의 동작에 대한 이해
* [AFNetworking](https://github.com/AFNetworking/AFNetworking)
  * 비동기 HTTP 요청 처리에 용이하므로 기존에도 이미 API 호출을 위해서도 사용하고 있었습니다.
  * 이 글의 내용은 버전 2.6.3 기준입니다.
* [Swift 언어](https://developer.apple.com/swift/)와 그에 대한 이해
  * 사실 Objective-C를 사용해도 무방하지만, 작업 당시 Swift가 발표된 지 얼마 되지 않은 시점 이었기 때문에 시험 삼아 선택 되었으며 실제로 Swift가 Objective-C 대비 가진 장점들이 적지 않게 활용되었습니다. 
  * 이 글의 내용은 버전 2.0 기준입니다.

# 구조와 동작
클래스 이름 앞에 붙어 있는 RB는 리디북스에서 사용하는 클래스 접두어 입니다.

## RBApiService

![RBApiService class diagram](https://i.imgur.com/AakhSry.png){: data-action="zoom" }

API 통신을 담당하는 부분의 핵심은 중앙의 RBApiService 클래스를 포함한 상속 구조라고 할 수 있으며 상술하면 다음과 같습니다.

* AFNetworking에서, HTTP 요청 작업의 큐잉부터 시작과 종료까지 라이프 사이클 전반을 관리하는 역할을 하는 AFHTTPRequestOperationManager를 상속받는 RBApiService 클래스를 정의
* 각 API들은 역할군에 따라 RBBookService(책 정보 관련 API), RBAccountService(사용자 계정/인증 관련 API) 등과 같은 RBApiService의 하위 클래스들의 메소드로 정의됨
* 이 하위 클래스들이 AFHTTPRequestOperationManager의 역할을 그대로 이어받아 자신을 통해 이루어지는 API HTTP 요청 작업들을 관리

이 설명에 따르면 웹 서버의 /api/foo/bar API를 요청하는 메소드는 RBFooService 클래스에 다음과 같이 정의될 것입니다.

{% highlight swift linenos %}
func bar(param1: String, param2: String, success: RBApiSuccessCallback, failure: RBApiFailureCallback) -> AFHTTPRequestOperation! {
    let paramters = ["param1": param1, "param2": param2]
    responseSerializer = RBJSONResponseSerializer(responseClass: RBFooBarResponse.class)
    return GET("/api/foo/bar", parameters: parameters, success: success, failure: failure)
}
{% endhighlight %}

RBApiSuccessCallback과 RBApiFailureCallback은 요청과 응답이 완료되고 각각 성공, 실패일 때 호출되는 람다 함수(Objective-C의 block에 대응되는 개념) 타입으로 다음과 같이 typealias를 통해 선언되어 있습니다.

{% highlight swift linenos %}
typealias RBApiSuccessCallback = ((operation: AFHTTPRequestOperation, responseObject: AnyObject) -> Void)?
typealias RBApiFailureCallback = ((operation: AFHTTPRequestOperation?, error: NSError) -> Void)?
{% endhighlight %}

GET 메소드는 AFHTTPRequestOperationManager의 메소드로 새로운 HTTP GET 요청 작업을 생성하고 큐에 넣은 뒤 그 인스턴스를 반환합니다. bar 메소드는 이렇게 반환된 인스턴스를 다시 그대로 반환하는데 API 호출을 의도한 측에서는 이 인스턴스를 통해 필요한 경우 요청 처리를 취소할 수 있습니다. API에 따라 GET 이외의 다른 방식의 요청이 필요하다면 POST, PUT, DELETE등의 메소드들 또한 사용할 수 있습니다.

RBFooBarResponse 클래스는 이 API 호출의 JSON 응답을 맵핑하기 위한 모델 클래스입니다. 이 API 요청의 응답은 RBJSONResponseSerializer 클래스를 통해 사전에 정의된 규칙에 따라 적절히 RBFooBarResponse 인스턴스로 변환되고 이 모든 과정이 성공적으로 진행되면 RBApiSuccessCallback의 responseObject 인자로 전달됩니다. 

## 모델 클래스와 RBJSONResponseSerializer

앞서 이야기했듯이 RBJSONResponseSerializer는 JSON 형태로 온 응답을 특정 모델 클래스의 인스턴스로 맵핑시키는 작업을 수행합니다(Retrofit+GSON 조합에서 GsonConverter의 역할에 대응한다고 볼 수 있습니다).

iOS 개발에서 전통적으로 JSON을 다루는 방식은 Cocoa 프레임워크에서 기본적으로 제공하는 NSJSONSerialization 클래스를 이용하여 JSON Array->NSArray로, 그 외의 JSON Object는 NSDictionary로 변환하여 사용하는 방식입니다. 이러한 방식을 사용할 경우 별다른 가공이 필요 없다는 장점이 있는 대신 다음과 같은 문제들에 직면할 수 있습니다.

* 데이터가 명시적으로 정의된 프로퍼티로 접근되지 않고 문자열 키 기반의 키-밸류 형태로만 접근되므로 데이터의 타입이 명시적이지 않아 타입 검사와 캐스팅이 난무하게 되어 가독성을 해침
* 오타와 같은 개발자의 단순 실수로 인한 버그를 유발할 가능성도 커짐

특히 오타로 인한 버그의 경우 명시적인 모델 클래스의 프로퍼티로 맵핑 해서 사용한다면 IDE가 에러를 검출해주거나 최소한 빌드 타임 에러가 발생할테니 미연에 방지할 수 있습니다. 이러한 문제는 사소한 실수로 인해 찾기 힘든 버그가 발생한다는 점과 코드 리뷰를 통해서도 발견하기가 힘들다는 점에서 지속적으로 개발자를 괴롭힐 수 있습니다.

RBJSONResponseSerializer를 통한 인스턴스로의 변환은 이런 문제 의식에서 출발했고 Retrofit에 GSON을 연계하여 사용하기 위한 GsonConverter가 해결을 위한 힌트를 제공한 셈입니다.

{% highlight swift linenos %}
// AFJsonResponseSerializer는 NSJSONSerializer를 이용해 NSArray/NSDictionary로 변환하는 기본적인 작업을 해줌
class RBJSONResponseSerializer: AFJSONResponseSerializer {
    var responseClass: NSObject.Type!

    override init() {
        super.init()
    }

    required init(responseClass: NSObject.Type!) {
        self.responseClass = responseClass
        super.init()
    }

    required init(coder aDecoder: NSCoder) {
        fatalError("init(coder:) has not been implemented")
    }

    override func responseObjectForResponse(response: NSURLResponse?, data: NSData?, error: NSErrorPointer) -> AnyObject? {
        // 파서를 직접 구현하는 건 노력이 많이 필요하므로 우선 AFJSONResponseSerializer를 이용해 NSArray/NSDictionary로 변환
        let responseObject: AnyObject! = super.responseObjectForResponse(response, data: data, error: error)

        if let dictionary = responseObject as? NSDictionary where responseClass != nil {
           // 변환 결과가 NSDictionary이면서 responseClass가 정의되어 있다면 변환 작업 시작
           return responseClass.fromDictionary(dictionary, keyTranslator: PropertyKeyTranslator)
        }

        // NSArray라면 JSON이 top level array로 이루어졌다는 뜻이므로 변환 불가로 보고 그대로 반환
        // 혹은 responseClass가 정의되어 있지 않아도 그대로 반환
        return responseObject
    }
}
{% endhighlight %}

## Key translator

fromDictionary 메소드 호출 시 함께 인자로 전달되는 keyTraslator는 JSON에서 사용되는 키로부터 모델 클래스의 프로퍼티 이름으로의 변환을 나타내는 람다 함수로 개발자가 원하는 규칙에 따라 정의하면 됩니다. 위의 코드에서 사용 중인 PropertyKeyTranslator는 리디북스 API에서 사용 중인 규칙 및 Swift의 네이밍 컨벤션에 따라 다음과 같이 언더스코어(_) 케이스로 된 이름을 카멜 케이스로 바꾸는 형태로 정의되었으며 이는 GSON의 FieldNamingPolicy 중 LOWERCASE_WITH_UNDERSCORES와 유사합니다.

{% highlight swift linenos %}
let PropertyKeyTranslator = { (keyName: String) -> String in
    let words = keyName.characters.split { $0 == "_" }.map { String($0) }
    var translation: String = words[0]
    for i in 1..<words.count {
        translation += words[i].capitalizedString
    }
    return translation
}
{% endhighlight %}

## NSObject.fromDictionary 메소드

fromDictionary 메소드는 NSDictionary로 표현된 데이터를 실제 모델 클래스의 인스턴스로 변환하는 작업을 수행하며 NSObject의 extension(Objective-C의 category 개념과 유사합니다)으로 정의하여 원하는 모델 클래스가 어떤 것이든지 간에 공통적인 방법을 사용할 수 있게끔 했습니다.

{% highlight swift linenos %}
extension NSObject {
    class func fromDictionary(dictionary: NSDictionary) -> Self {
        // keyTranslator가 주어지지 않으면 디폴트 translator 사용
        return fromDictionary(dictionary, keyTranslator: { $0 })
    }

    class func fromDictionary(dictionary: NSDictionary, keyTranslator: (String) -> String) -> Self {
        let object = self.init()
        (object as NSObject).loadDictionary(dictionary, keyTranslator: keyTranslator)
        return object
    }

    func loadDictionary(dictionary: NSDictionary, keyTranslator: (String) -> String) {
        // 주어진 dictionary에 포함된 모든 키-밸류 쌍에 대해 작업 수행
        for (key, value) in (dictionary as? [String: AnyObject]) ?? [:] {
            // keyTranslator를 이용해 키를 프로퍼티 이름으로 변환
            let keyName = keyTranslator(key)

            // 프로퍼티 이름을 사용할 수 있는지 검사
            if respondsToSelector(NSSelectorFromString(keyName)) {
                if let dictionary = value as? NSDictionary {
                    // 밸류가 NSDictionary면 해당 프로퍼티의 타입에 대해 fromDictionary 메소드 호출
                    if let ecls = object_getElementTypeOfProperty(self, propertyName: keyName) as? NSObject.Type {
                        setValue(ecls.fromDictionary(dictionary, keyTranslator: keyTranslator), forKey: keyName)
                    } else {
                        NSLog("NSObject.loadDictionary error: not found element type of property. (key: \(keyName), value: \(dictionary))")
                    }
                    continue
                } else if let array = value as? NSArray {
                    var newArray = [NSObject]()

                    // 밸류가 배열이면 각 요소별로 작업 수행
                    for object in array {
                        if let dictionary = object as? NSDictionary {
                            // 배열 요소가 NSDictionary면 프로퍼티의 배열 요소 타입에 대해 fromDictionary 메소드 호출한 뒤 배열에 추가
                            if let ecls = object_getElementTypeOfProperty(self, propertyName: keyName) as? NSObject.Type {
                                newArray.append(ecls.fromDictionary(dictionary, keyTranslator: keyTranslator))
                            } else {
                                NSLog("NSObject.loadDictionary error: not found element type of property. (key: \(keyName), value: \(dictionary))")
                            }
                        } else if let object = object as? NSObject {
                            // NSDictionary가 아니면 그대로 배열에 추가
                            newArray.append(object)
                        } else {
                            NSLog("NSObject.loadDictionary error: can't cast element. (key: \(keyName), value: \(object))")
                        }
                    }
                    setValue(newArray, forKey: keyName)
                    continue
                } else if value is NSNull {
                    continue
                }
                // NSDictionary, NSArray가 아니면서 null도 아니면 그대로 사용
                setValue(value, forKey: keyName)
            }
        }
    }
}
{% endhighlight %}

주어진 dictionary에 존재하는 모든 키-밸류 쌍에 대해 밸류가 가진 타입과 이에 대응하는 프로퍼티의 타입에 따라 적절히 프로퍼티에 대응될 객체를 구한 다음 Cocoa 프레임워크에서 제공하는 [KVC](https://developer.apple.com/library/ios/documentation/General/Conceptual/DevPedia-CocoaCore/KeyValueCoding.html)를 이용해 채워넣습니다.

## 프로퍼티 타입 정보 가져오기

모델 클래스가 반드시 Int, String, Float과 같은 기본적인 타입들로만 이루어져 있을 필요는 없고 다른 모델 클래스의 인스턴스나 배열을 포함하고 있어도 타입 정보를 런타임에 가져와 재귀적으로 데이터를 채워나가는 것이 가능합니다. 프로퍼티의 타입을 알아내는 과정은 다음과 같이 Swift에서 제공하는 [Mirror 구조체](https://developer.apple.com/library/watchos/documentation/Swift/Reference/Swift_Mirror_Structure/index.html)를 통해 이루어지는데 이는 마치 (이름에서도 느낄 수 있듯이) Java의 리플렉션을 떠올리게 합니다.

{% highlight swift linenos %}
// 타입 이름에서 특정 접두어("Optional", "Array", "Dictionary" 등)를 찾아 제거 
func encodeType_getUnwrappingType(encodeType: String, keyword: String) -> String {
    if encodeType.hasPrefix(keyword) {
        let removeRange = Range(start: encodeType.startIndex.advancedBy(keyword.length + 1), end: encodeType.endIndex.advancedBy(-1))
        return encodeType.substringWithRange(removeRange)
    } else {
        return encodeType
    }
}

// object의 타입에서 propertyName의 이름을 갖는 프로퍼티의 타입 이름을 반환
func object_getEncodeType(object: AnyObject, propertyName name: String) -> String? {
    let mirror = Mirror(reflecting: object)
    let mirrorChildrenCollection = AnyRandomAccessCollection(mirror.children)!
    // object의 타입 구조 children 중에서 propertyName을 찾음 
    for (label, value) in mirrorChildrenCollection {
        if label == name {
            // Optional 타입인 경우 "Optional" 접두어를 제외
            return encodeType_getUnwrappingType("\(value.dynamicType)", keyword: "Optional")
        }
    }
    return nil
}

// object의 타입에서 propertyName의 이름을 갖는 프로퍼티의 타입 인스턴스를 반환
func object_getElementTypeOfProperty(object: AnyObject, propertyName name: String) -> AnyClass? {
    // 타입의 이름을 가져옴
    if var encodeType = object_getEncodeType(object, propertyName: name) {
        let array = "Array"
        // "Array" 접두어로 시작할 경우 (배열인 경우)
        if encodeType.hasPrefix(array) {
            // "Array<T>" 에서 "Array" 제외하고 T를 반환
            return NSClassFromString(encodeType_getUnwrappingType(encodeType, keyword: array))
        }

        let dictionary = "Dictionary"
        if encodeType.hasPrefix(dictionary) {
            // "Dictionary<K, V>" 에서 "Dictionary", "K"를 제외하고 V를 반환
            encodeType = encodeType_getUnwrappingType(encodeType, keyword: dictionary)
            encodeType = encodeType.substringWithRange(Range(start: encodeType.rangeOfString(", ")!.endIndex.advancedBy(1), end: encodeType.endIndex))
            return NSClassFromString(encodeType)
        }

        // 커스텀 클래스 접두어를 가지고 있다면 그 타입 그대로 반환
        if encodeType.hasPrefix(RidibooksClassPrefix) {
            return NSClassFromString(encodeType)
        }
    }
    return nil
}
{% endhighlight %}

RidibooksClassPrefix는 커스텀 클래스들의 접두어를 나타내는 상수이며(리디북스의 경우 앞서 이야기했듯 “RB”), 이 접두어가 붙어있는 경우에만 모델 클래스로 간주해 해당 타입 인스턴스가 반환됩니다.

## 예시

앞서 정의한 PropertyKeyTranslator를 사용했을 때, 위에 예시로 사용했던 /foo/bar API 요청의 JSON 응답과 모델 클래스 및 생성되는 인스턴스 형태의 예를 들면 다음과 같을 것입니다.

_(Int, Bool, Float과 같은 기존 NSNumber 기반의 타입을 가지는 프로퍼티들은 아직 정확한 원인은 알 수 없으나 nil 이외의 값으로 초기화 해주지 않으면 프로퍼티가 존재하는지 확인하기 위해 사용하는 respondsToSelector 메소드가 false를 뱉게 되어 사용할 수 없으므로 클래스 선언시 적절한 초기값을 주어야 합니다.)_

{% highlight json linenos %}
{
    "success": true,
    "int_value": 1,
    "string_value": "Hello!",
    "float_value": null,
    "baz_qux": {
        "array_value": [1, 2, 3]
    }
}
{% endhighlight %}

{% highlight swift linenos %}
class RBFooBarResponse : NSObject {
    var success = false             // true
    var intValue = 0                // 1
    var stringValue: String!        // "Hello!"
    var floatValue: Float! = 0.0    // nil
    var bazQux: RBBazQux!
}

class RBBazQux : NSObject {
    var arrayValue: [Int]!          // [1, 2, 3]
}
{% endhighlight %}
---

# 맺음말
이런 작업들을 통해 당초 목표했던 두 가지, API 통신 관련 중복 코드를 최소화 하면서 JSON 응답을 가독성이 더 좋고 실수할 확률이 적은 모델 클래스의 인스턴스로 자동 변환 하도록 하는 것 모두 달성하는 데에 성공했습니다.

다만 모든 것이 뜻대로 될 수는 없었는데 Retrofit+GSON과 비교했을 때 플랫폼 혹은 언어의 특성에 기인하는 다음과 같은 한계들 또한 존재했습니다.

* Retrofit에서는 Java 어노테이션을 이용해 API 메소드의 인터페이스만 정의하면 됐지만 iOS 구현에서는 GET, POST 등의 실제 요청 생성 메소드를 호출 하는 것 까지는 직접 구현해줘야 함
* 키->프로퍼티 이름 변환 규칙에 예외 사항이 필요할 때 GSON에서는 @SerializedName 어노테이션을 통해 손쉽게 지정할 수 있지만 iOS 구현에서는 예외 허용을 위한 깔끔한 방법을 찾기가 힘듬 (다만, 예외가 필요한 경우가 특별히 많지는 않기 때문에 큰 문제는 되지 않음)

향후에는 HTTP 통신을 위해 사용 중인 AFNetworking(Objective-C로 작성됨)을 온전히 Swift로만 작성된 [Alamofire](https://github.com/Alamofire/Alamofire)로 교체하는 것을 검토 중이며 기존에 비해 좀 더 간결한 코드를 사용할 수 있을 것으로 기대하고 있습니다. 다만 Alamofire의 최신 버전이 iOS 8 이상을 지원하고 있어 iOS 7을 아직 지원 중인 리디북스인 관계로 언제 적용할 수 있을지는 아직 미지수입니다.
