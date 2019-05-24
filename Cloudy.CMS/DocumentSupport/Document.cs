﻿using MongoDB.Bson.Serialization.Attributes;
using System;
using System.Collections.Generic;
using System.Collections.ObjectModel;
using System.Linq;
using System.Text;

namespace Cloudy.CMS.DocumentSupport
{
    public class Document
    {
        public string Id { get; set; }
        public DocumentFacet GlobalFacet { get; set; }
        public IDictionary<string, DocumentFacet> LanguageFacets { get; set; }

        public Document(string id, DocumentFacet globalFacet, IDictionary<string, DocumentFacet> languageFacets)
        {
            Id = id;
            GlobalFacet = globalFacet;
            LanguageFacets = new ReadOnlyDictionary<string, DocumentFacet>(languageFacets);
        }
    }
}
