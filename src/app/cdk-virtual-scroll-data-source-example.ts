import { CollectionViewer, DataSource } from '@angular/cdk/collections';
import { HttpClient } from '@angular/common/http';
import {
  ChangeDetectionStrategy,
  Component,
  Optional,
  Inject,
  ChangeDetectorRef
} from '@angular/core';
import { BehaviorSubject, Observable, Subscription } from 'rxjs';

/** @title Virtual scroll with a custom data source */
@Component({
  selector: 'cdk-virtual-scroll-data-source-example',
  styleUrls: ['cdk-virtual-scroll-data-source-example.css'],
  templateUrl: 'cdk-virtual-scroll-data-source-example.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CdkVirtualScrollDataSourceExample {
  ds: MyDataSource;
  constructor(private http: HttpClient,private ChangeDetectorRef:ChangeDetectorRef) {
    this.ds = new MyDataSource(http,ChangeDetectorRef);
    console.log(this.ds)
  }
}

export class MyDataSource extends DataSource<{name:string,url:string}  | undefined> {
  constructor(@Inject(HttpClient) private http: HttpClient,@Inject(ChangeDetectorRef) private change:ChangeDetectorRef) {
    super();
    this.http
      .get('https://pokeapi.co/api/v2/pokemon/')
      .subscribe((res: any) => {
        console.log({res})
        this._length = res.count
        this._cachedData = res.results
        this._next = res.next
        this.change.detectChanges()
      });
  }
  private _next:string = ''
  private _length = 100000;
  private _pageSize = 20;
  private _cachedData:any[] =Array.from<string>({length: this._length});

  private _fetchedPages = new Set<number>();
  private readonly _dataStream = new BehaviorSubject<({name:string,url:string} | undefined)[]>(
    this._cachedData
  );
  private readonly _subscription = new Subscription();

  connect(
    collectionViewer: CollectionViewer
  ): Observable<({name:string,url:string}  | undefined)[]> {
    this._subscription.add(
      collectionViewer.viewChange.subscribe((range) => {
        const startPage = this._getPageForIndex(range.start);
        const endPage = this._getPageForIndex(range.end - 1);
        for (let i = startPage; i <= endPage; i++) {
          this._fetchPage(i);
        }
      })
    );
    return this._dataStream;
  }

  disconnect(): void {
    this._subscription.unsubscribe();
  }

  private _getPageForIndex(index: number): number {
    return Math.floor(index / this._pageSize);
  }

  private _fetchPage(page: number) {
    if (this._fetchedPages.has(page)) {
      return;
    }
    this._fetchedPages.add(page);

    // Use `setTimeout` to simulate fetching data from server.
    this.http
      .get(this._next)
      .subscribe((res: any) => {
        console.log({res})
        this._next = res.next
        const newArray:any[] = res.results
        this._cachedData.splice(
          page * this._pageSize,
          this._pageSize,
          ...newArray
        );
        this._dataStream.next(this._cachedData);
      })
    // setTimeout(() => {
    //   this._cachedData.splice(
    //     page * this._pageSize,
    //     this._pageSize,
    //     ...this.newArray
    //   );
    //   this._dataStream.next(this._cachedData);
    // }, Math.random() * 1000 + 200);
  }
}

/**  Copyright 2022 Google LLC. All Rights Reserved.
    Use of this source code is governed by an MIT-style license that
    can be found in the LICENSE file at https://angular.io/license */
